import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import { recomendarComIA } from '../../services/iaService'
import { tokenOpcional } from '../middlewares/verificaToken'

const router = Router()

const pesos: Record<string, number> = { COMPRA: 3, FAVORITO: 2, VISUALIZOU: 1 }

async function generoMaisConsumido(clienteId: number) {
  const interacoes = await prisma.interacao.findMany({
    where: { clienteId },
    include: { show: { include: { genero: true } } },
    orderBy: { atualizadoEm: 'desc' },
  })

  if (interacoes.length > 0) {
    const pontos: Record<number, number> = {}
    for (const i of interacoes) {
      pontos[i.show.generoId] = (pontos[i.show.generoId] ?? 0) + pesos[i.tipo]
    }
    const maior = Math.max(...Object.values(pontos))
    const genero = interacoes.find((i) => pontos[i.show.generoId] === maior)!.show.genero
    return { genero, origem: 'historico' }
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, include: { preferencias: true } })
  if (cliente?.preferenciasAtivas && cliente.preferencias.length > 0) {
    return { genero: cliente.preferencias[0], origem: 'preferencias' }
  }
  return null
}

router.get('/', tokenOpcional, async (req: any, res) => {
  // #swagger.tags = ['Recomendações']
  // #swagger.summary = 'Módulo de IA: recomenda shows do gênero mais consumido pelo cliente'
  try {
    const consumo = req.clienteId ? await generoMaisConsumido(req.clienteId) : null

    if (!consumo) {
      const proximos = await prisma.show.findMany({
        where: { dataHora: { gte: new Date() } },
        include: { local: true, genero: true },
        orderBy: { dataHora: 'asc' },
        take: 4,
      })
      res.status(200).json({ modo: 'geral', genero: null, justificativa: 'Confira os próximos shows da agenda.', shows: proximos })
      return
    }

    const shows = await prisma.show.findMany({
      where: { generoId: consumo.genero.id, dataHora: { gte: new Date() } },
      include: { local: true, genero: true },
      orderBy: { dataHora: 'asc' },
      take: 20,
    })

    try {
      const lista = shows.map((s) => ({
        id: s.id,
        atracao: s.atracao,
        data: s.dataHora.toISOString(),
        local: s.local.nome,
        descricao: s.descricao,
      }))
      const { ids, justificativa } = await recomendarComIA(consumo.genero.nome, lista)
      res.status(200).json({
        modo: 'ia',
        genero: consumo.genero,
        origem: consumo.origem,
        justificativa,
        shows: ids.map((id) => shows.find((s) => s.id === id)),
      })
    } catch (erroIA: any) {
      console.log('Falha ao consultar a IA, usando recomendação local:', erroIA.message)
      res.status(200).json({
        modo: 'fallback',
        genero: consumo.genero,
        origem: consumo.origem,
        justificativa: `Separamos os próximos shows de ${consumo.genero.nome}, o estilo que você mais curte.`,
        shows: shows.slice(0, 4),
      })
    }
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar recomendações' })
  }
})

export default router

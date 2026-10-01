import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { tokenOpcional, verificaToken } from '../middlewares/verificaToken'

const router = Router()

export const showSchema = z.object({
  atracao: z.string().trim().min(2, { message: 'Atração deve possuir, no mínimo, 2 caracteres' }),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida' }),
  horario: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Horário inválido' }),
  generoId: z.number({ message: 'Selecione o gênero musical' }),
  valor: z.number().min(0, { message: 'Valor não pode ser negativo' }),
  descricao: z.string().trim().min(10, { message: 'Descrição deve possuir, no mínimo, 10 caracteres' }),
})

export function montarDataHora(data: string, horario: string) {
  return new Date(`${data}T${horario}:00-03:00`)
}

router.get('/', tokenOpcional, async (req: any, res) => {
  // #swagger.tags = ['Shows']
  // #swagger.summary = 'Próximos shows de todos os locais (prioriza as preferências do cliente logado)'
  const { busca, generoId } = req.query

  try {
    const shows = await prisma.show.findMany({
      where: {
        dataHora: { gte: new Date() },
        generoId: generoId ? Number(generoId) : undefined,
        OR: busca
          ? [
              { atracao: { contains: String(busca), mode: 'insensitive' } },
              { local: { nome: { contains: String(busca), mode: 'insensitive' } } },
              { local: { cidade: { contains: String(busca), mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: { local: true, genero: true },
      orderBy: { dataHora: 'asc' },
    })

    let preferencias: number[] = []
    if (req.clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: req.clienteId },
        include: { preferencias: true },
      })
      if (cliente?.preferenciasAtivas) preferencias = cliente.preferencias.map((g) => g.id)
    }

    const preferidos = shows.filter((s) => preferencias.includes(s.generoId))
    const outros = shows.filter((s) => !preferencias.includes(s.generoId))
    res.status(200).json({ priorizado: preferencias.length > 0, preferidos, outros })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar shows' })
  }
})

router.get('/admin', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Shows do local do administrador, com contagem de interesse'
  try {
    const shows = await prisma.show.findMany({
      where: { local: { adminId: req.usuarioId } },
      include: { genero: true, _count: { select: { interacoes: true } } },
      orderBy: { dataHora: 'asc' },
    })
    res.status(200).json(shows)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar shows' })
  }
})

router.get('/:id', async (req, res) => {
  // #swagger.tags = ['Shows']
  // #swagger.summary = 'Detalhes do show com endereço e foto do local'
  try {
    const show = await prisma.show.findUnique({
      where: { id: Number(req.params.id) },
      include: { local: true, genero: true },
    })
    if (!show) {
      res.status(404).json({ erro: 'Show não encontrado' })
      return
    }
    res.status(200).json(show)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar show' })
  }
})

router.post('/', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Cria um show na agenda do local'
  const valida = showSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  const { atracao, data, horario, generoId, valor, descricao } = valida.data
  const dataHora = montarDataHora(data, horario)
  if (dataHora < new Date()) {
    res.status(400).json({ erro: 'A data do show deve ser futura' })
    return
  }

  try {
    const local = await prisma.local.findUnique({ where: { adminId: req.usuarioId } })
    const show = await prisma.show.create({
      data: { atracao, dataHora, generoId, valor, descricao, localId: local!.id },
    })
    res.status(201).json(show)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar show' })
  }
})

router.put('/:id', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Edita um show do local'
  const valida = showSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  const { atracao, data, horario, generoId, valor, descricao } = valida.data

  try {
    const atual = await prisma.show.findUnique({ where: { id: Number(req.params.id) }, include: { local: true } })
    if (!atual || atual.local.adminId !== req.usuarioId) {
      res.status(403).json({ erro: 'Você só pode alterar shows do seu local' })
      return
    }
    const show = await prisma.show.update({
      where: { id: atual.id },
      data: { atracao, dataHora: montarDataHora(data, horario), generoId, valor, descricao },
    })
    res.status(200).json(show)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao alterar show' })
  }
})

router.delete('/:id', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Exclui um show do local'
  try {
    const atual = await prisma.show.findUnique({ where: { id: Number(req.params.id) }, include: { local: true } })
    if (!atual || atual.local.adminId !== req.usuarioId) {
      res.status(403).json({ erro: 'Você só pode excluir shows do seu local' })
      return
    }
    await prisma.show.delete({ where: { id: atual.id } })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao excluir show' })
  }
})

export default router

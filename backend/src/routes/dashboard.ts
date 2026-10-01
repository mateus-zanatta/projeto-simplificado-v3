import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import { verificaToken } from '../middlewares/verificaToken'

const router = Router()

router.get('/', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Indicadores e dados dos gráficos do local'
  try {
    const shows = await prisma.show.findMany({
      where: { local: { adminId: req.usuarioId } },
      include: { genero: true, interacoes: true },
    })

    const contar = (lista: { tipo: string }[], tipo: string) => lista.filter((i) => i.tipo === tipo).length
    const interacoes = shows.flatMap((s) => s.interacoes)

    const gerais = {
      shows: shows.length,
      proximos: shows.filter((s) => s.dataHora > new Date()).length,
      vendas: contar(interacoes, 'COMPRA'),
      favoritos: contar(interacoes, 'FAVORITO'),
      visualizacoes: contar(interacoes, 'VISUALIZOU'),
    }

    const porGenero: Record<string, number> = {}
    for (const show of shows) {
      porGenero[show.genero.nome] = (porGenero[show.genero.nome] ?? 0) + contar(show.interacoes, 'COMPRA')
    }

    const meses = []
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1)
      const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)
      const doMes = interacoes.filter((x) => x.criadoEm >= inicio && x.criadoEm < fim)
      meses.push({
        mes: `${String(inicio.getMonth() + 1).padStart(2, '0')}/${inicio.getFullYear()}`,
        vendas: contar(doMes, 'COMPRA'),
        visualizacoes: contar(doMes, 'VISUALIZOU'),
      })
    }

    res.status(200).json({
      gerais,
      porGenero: Object.entries(porGenero).map(([genero, num]) => ({ genero, num })),
      meses,
    })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao gerar dashboard' })
  }
})

export default router

import { Router } from 'express'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/', async (req, res) => {
  // #swagger.tags = ['Gêneros']
  // #swagger.summary = 'Lista os gêneros musicais'
  try {
    const generos = await prisma.genero.findMany({ orderBy: { nome: 'asc' } })
    res.status(200).json(generos)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar gêneros' })
  }
})

export default router

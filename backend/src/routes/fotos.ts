import { Router } from 'express'
import { prisma } from '../../lib/prisma'

const router = Router()

router.get('/:id', async (req, res) => {
  // #swagger.tags = ['Fotos']
  // #swagger.summary = 'Imagem de um local'
  try {
    const foto = await prisma.foto.findUnique({ where: { id: Number(req.params.id) } })
    if (!foto) {
      res.status(404).json({ erro: 'Foto não encontrada' })
      return
    }
    res.set('Content-Type', foto.tipo)
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(Buffer.from(foto.dados))
  } catch (error) {
    res.status(400).json({ erro: 'Foto inválida' })
  }
})

export default router

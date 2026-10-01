import multer from 'multer'
import { NextFunction, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'

const tipos = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (tipos.includes(file.mimetype)) cb(null, true)
    else cb(new Error('Envie uma imagem JPG, PNG ou WEBP'))
  },
})

export function uploadFoto(req: Request, res: Response, next: NextFunction) {
  upload.single('foto')(req, res, (erro: any) => {
    if (erro?.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ erro: 'A imagem deve ter no máximo 2 MB' })
      return
    }
    if (erro) {
      res.status(400).json({ erro: erro.message })
      return
    }
    next()
  })
}

export async function salvarFoto(arquivo: Express.Multer.File) {
  const foto = await prisma.foto.create({ data: { dados: new Uint8Array(arquivo.buffer), tipo: arquivo.mimetype } })
  return `/fotos/${foto.id}`
}

export async function apagarFoto(foto?: string | null) {
  if (foto?.startsWith('/fotos/')) {
    await prisma.foto.deleteMany({ where: { id: Number(foto.split('/')[2]) } })
  }
}

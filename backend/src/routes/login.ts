import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { prisma } from '../../lib/prisma'

const router = Router()

const mensaPadrao = 'Login ou senha incorretos'

export function gerarToken(usuarioId: number, perfil: 'admin' | 'cliente') {
  return jwt.sign({ usuarioId, perfil }, process.env.JWT_SECRET as string, { expiresIn: '1d' })
}

router.post('/cliente', async (req, res) => {
  // #swagger.tags = ['Login']
  // #swagger.summary = 'Login do cliente'
  const { email, senha } = req.body
  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const cliente = await prisma.cliente.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (!cliente || !bcrypt.compareSync(senha, cliente.senha)) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }
    res.status(200).json({
      id: cliente.id,
      nome: cliente.nome,
      email: cliente.email,
      perfil: 'cliente',
      token: gerarToken(cliente.id, 'cliente'),
    })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao fazer login' })
  }
})

router.post('/admin', async (req, res) => {
  // #swagger.tags = ['Login']
  // #swagger.summary = 'Login do administrador'
  const { email, senha } = req.body
  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (!admin || !bcrypt.compareSync(senha, admin.senha)) {
      res.status(400).json({ erro: mensaPadrao })
      return
    }
    res.status(200).json({
      id: admin.id,
      nome: admin.nome,
      email: admin.email,
      perfil: 'admin',
      token: gerarToken(admin.id, 'admin'),
    })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao fazer login' })
  }
})

export default router

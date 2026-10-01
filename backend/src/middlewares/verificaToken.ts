import jwt from 'jsonwebtoken'
import { NextFunction, Response } from 'express'

type TokenType = {
  usuarioId: number
  perfil: 'admin' | 'cliente'
}

function lerToken(req: any): TokenType | null {
  const { authorization } = req.headers
  if (!authorization) return null
  const token = authorization.split(' ')[1]
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenType
}

export function verificaToken(perfil: 'admin' | 'cliente') {
  return (req: any, res: Response, next: NextFunction) => {
    try {
      const dados = lerToken(req)
      if (!dados) {
        res.status(401).json({ erro: 'Faça login para continuar' })
        return
      }
      if (dados.perfil !== perfil) {
        res.status(403).json({ erro: 'Acesso não permitido para o seu perfil' })
        return
      }
      req.usuarioId = dados.usuarioId
      next()
    } catch {
      res.status(401).json({ erro: 'Sessão expirada. Faça login novamente' })
    }
  }
}

export function tokenOpcional(req: any, res: Response, next: NextFunction) {
  try {
    const dados = lerToken(req)
    if (dados?.perfil === 'cliente') req.clienteId = dados.usuarioId
  } catch {}
  next()
}

import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { verificaToken } from '../middlewares/verificaToken'
import { gerarToken } from './login'

const router = Router()

const clienteSchema = z.object({
  nome: z.string().trim().min(2, { message: 'Nome deve possuir, no mínimo, 2 caracteres' }),
  email: z.string().trim().toLowerCase().pipe(z.email({ message: 'E-mail inválido' })),
  senha: z.string().min(6, { message: 'Senha deve possuir, no mínimo, 6 caracteres' }),
  preferencias: z.array(z.number()).min(1, { message: 'Selecione ao menos um estilo musical' }),
})

const preferenciasSchema = z.object({
  ativas: z.boolean().optional(),
  generoIds: z.array(z.number()).min(1, { message: 'Selecione ao menos um estilo musical' }).optional(),
})

router.post('/', async (req, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Cadastro do cliente com preferências musicais'
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  const { nome, email, senha, preferencias } = valida.data

  try {
    const existe = await prisma.cliente.findUnique({ where: { email } })
    if (existe) {
      res.status(400).json({ erro: 'E-mail já cadastrado' })
      return
    }
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        email,
        senha: bcrypt.hashSync(senha, 10),
        preferencias: { connect: preferencias.map((id) => ({ id })) },
      },
    })
    res.status(201).json({ id: cliente.id, nome, email, perfil: 'cliente', token: gerarToken(cliente.id, 'cliente') })
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar cliente' })
  }
})

router.get('/perfil', verificaToken('cliente'), async (req: any, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Perfil do cliente logado'
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.usuarioId },
      select: { id: true, nome: true, email: true, preferenciasAtivas: true, preferencias: true, criadoEm: true },
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar perfil' })
  }
})

router.patch('/preferencias', verificaToken('cliente'), async (req: any, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Liga/desliga as preferências e altera os estilos'
  const valida = preferenciasSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  const { ativas, generoIds } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: req.usuarioId },
      data: {
        preferenciasAtivas: ativas,
        preferencias: generoIds ? { set: generoIds.map((id) => ({ id })) } : undefined,
      },
      select: { id: true, nome: true, email: true, preferenciasAtivas: true, preferencias: true, criadoEm: true },
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao atualizar preferências' })
  }
})

router.get('/agenda', verificaToken('cliente'), async (req: any, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Ingressos comprados e favoritos'
  try {
    const interacoes = await prisma.interacao.findMany({
      where: { clienteId: req.usuarioId, tipo: { in: ['COMPRA', 'FAVORITO'] } },
      include: { show: { include: { local: true, genero: true } } },
      orderBy: { show: { dataHora: 'asc' } },
    })
    res.status(200).json({
      ingressos: interacoes.filter((i) => i.tipo === 'COMPRA').map((i) => i.show),
      favoritos: interacoes.filter((i) => i.tipo === 'FAVORITO').map((i) => i.show),
    })
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar agenda' })
  }
})

const tipos: Record<string, 'FAVORITO' | 'COMPRA' | 'VISUALIZOU'> = {
  favorito: 'FAVORITO',
  compra: 'COMPRA',
  visualizou: 'VISUALIZOU',
}

router.put('/interacoes/:showId/:tipo', verificaToken('cliente'), async (req: any, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Registra favorito, compra ou visualização'
  const tipo = tipos[req.params.tipo]
  const showId = Number(req.params.showId)
  if (!tipo) {
    res.status(400).json({ erro: 'Tipo inválido' })
    return
  }

  try {
    await prisma.interacao.upsert({
      where: { clienteId_showId_tipo: { clienteId: req.usuarioId, showId, tipo } },
      create: { clienteId: req.usuarioId, showId, tipo },
      update: { atualizadoEm: new Date() },
    })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ erro: 'Show não encontrado' })
  }
})

router.delete('/interacoes/:showId/:tipo', verificaToken('cliente'), async (req: any, res) => {
  // #swagger.tags = ['Clientes']
  // #swagger.summary = 'Remove um favorito'
  const tipo = tipos[req.params.tipo]
  if (tipo !== 'FAVORITO') {
    res.status(400).json({ erro: 'Tipo inválido' })
    return
  }

  try {
    await prisma.interacao.deleteMany({ where: { clienteId: req.usuarioId, showId: Number(req.params.showId), tipo } })
    res.status(204).send()
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao remover' })
  }
})

export default router

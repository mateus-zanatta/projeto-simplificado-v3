import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { apagarFoto, salvarFoto, uploadFoto } from '../middlewares/upload'
import { verificaToken } from '../middlewares/verificaToken'
import { gerarToken } from './login'
import { montarDataHora, showSchema } from './shows'

const router = Router()

const localSchema = z.object({
  localNome: z.string().trim().min(2, { message: 'Informe o nome do local' }),
  endereco: z.string().trim().min(3, { message: 'Informe o endereço' }),
  numero: z.string().trim().min(1, { message: 'Informe o número' }),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().min(2, { message: 'Informe a cidade' }),
})

const adminSchema = localSchema.extend({
  nome: z.string().trim().min(2, { message: 'Nome deve possuir, no mínimo, 2 caracteres' }),
  email: z.string().trim().toLowerCase().pipe(z.email({ message: 'E-mail inválido' })),
  senha: z.string().min(6, { message: 'Senha deve possuir, no mínimo, 6 caracteres' }),
})

router.post('/', uploadFoto, async (req, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Cadastro do dono do local (multipart: dados, foto e shows em JSON)'
  const valida = adminSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  if (!req.file) {
    res.status(400).json({ erro: 'Envie a foto do local' })
    return
  }

  let lista = null
  try {
    lista = JSON.parse(req.body.shows || '[]')
  } catch {}
  const shows = z.array(showSchema, { message: 'Lista de shows inválida' }).safeParse(lista)
  if (!shows.success) {
    res.status(400).json({ erro: shows.error.issues[0].message })
    return
  }

  if (shows.data.some((s) => montarDataHora(s.data, s.horario) < new Date())) {
    res.status(400).json({ erro: 'A data dos shows deve ser futura' })
    return
  }

  const { nome, email, senha, localNome, endereco, numero, bairro, cidade } = valida.data

  try {
    const existe = await prisma.admin.findUnique({ where: { email } })
    if (existe) {
      res.status(400).json({ erro: 'E-mail já cadastrado' })
      return
    }

    const foto = await salvarFoto(req.file)
    const admin = await prisma.admin.create({
      data: {
        nome,
        email,
        senha: bcrypt.hashSync(senha, 10),
        local: {
          create: {
            nome: localNome,
            endereco,
            numero,
            bairro,
            cidade,
            foto,
            shows: {
              create: shows.data.map((s) => ({
                atracao: s.atracao,
                dataHora: montarDataHora(s.data, s.horario),
                generoId: s.generoId,
                valor: s.valor,
                descricao: s.descricao,
              })),
            },
          },
        },
      },
    })
    res.status(201).json({ id: admin.id, nome, email, perfil: 'admin', token: gerarToken(admin.id, 'admin') })
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao cadastrar' })
  }
})

router.get('/local', verificaToken('admin'), async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Dados do local do administrador'
  try {
    const local = await prisma.local.findUnique({ where: { adminId: req.usuarioId } })
    res.status(200).json(local)
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao buscar local' })
  }
})

router.put('/local', verificaToken('admin'), uploadFoto, async (req: any, res) => {
  // #swagger.tags = ['Admin']
  // #swagger.summary = 'Altera endereço e foto do local (multipart)'
  const valida = localSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error.issues[0].message })
    return
  }
  const { localNome, endereco, numero, bairro, cidade } = valida.data

  try {
    const atual = await prisma.local.findUnique({ where: { adminId: req.usuarioId } })
    const foto = req.file ? await salvarFoto(req.file) : undefined
    const local = await prisma.local.update({
      where: { adminId: req.usuarioId },
      data: {
        nome: localNome,
        endereco,
        numero,
        bairro,
        cidade,
        foto,
      },
    })
    if (foto) await apagarFoto(atual?.foto)
    res.status(200).json(local)
  } catch (error) {
    res.status(400).json({ erro: 'Erro ao alterar local' })
  }
})

export default router

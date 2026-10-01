import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient, type TipoInteracao } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

const SENHA_PADRAO = 'senha123'
const DIA = 24 * 60 * 60 * 1000

let semente = 20261001
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296
  return semente / 4294967296
}
const inteiro = (min: number, max: number) => Math.floor(aleatorio() * (max - min + 1)) + min
const escolher = <T>(lista: T[]) => lista[Math.floor(aleatorio() * lista.length)]

function daquiA(dias: number, hora: string) {
  const base = new Date(Date.now() + dias * DIA)
  const data = base.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
  return new Date(`${data}T${hora}:00-03:00`)
}

const GENEROS = [
  'Rock', 'Pop', 'MPB', 'Samba e Pagode', 'Sertanejo', 'Funk',
  'Eletrônica', 'Jazz e Blues', 'Rap e Hip-Hop', 'Forró', 'Reggae', 'Indie',
]

const LOCAIS = [
  {
    admin: { nome: 'Marina Costa', email: 'admin@armazemsonoro.com' },
    local: { nome: 'Armazém Sonoro', endereco: 'Rua Andrade Neves', numero: '1520', bairro: 'Centro', cidade: 'Pelotas' },
    foto: 'armazem-sonoro.jpg',
  },
  {
    admin: { nome: 'Rafael Lima', email: 'admin@teatroaurora.com' },
    local: { nome: 'Teatro Aurora', endereco: 'Praça Coronel Pedro Osório', numero: '160', bairro: 'Centro', cidade: 'Pelotas' },
    foto: 'teatro-aurora.jpg',
  },
  {
    admin: { nome: 'Juliana Prates', email: 'admin@galpao22.com' },
    local: { nome: 'Galpão 22', endereco: 'Avenida Bento Gonçalves', numero: '2200', bairro: 'Porto', cidade: 'Pelotas' },
    foto: 'galpao-22.jpg',
  },
  {
    admin: { nome: 'Diego Moraes', email: 'admin@esquinaazul.com' },
    local: { nome: 'Bar da Esquina Azul', endereco: 'Rua Padre Chagas', numero: '315', bairro: 'Moinhos de Vento', cidade: 'Porto Alegre' },
    foto: 'bar-esquina-azul.jpg',
  },
]

const ATRACOES: Record<string, string[]> = {
  Rock: ['Os Vira-Latas Elétricos', 'Trovão Distante', 'Garagem 77', 'Madeira de Lei'],
  Pop: ['Luna Prado', 'Neon Coração', 'Caleidoscópio'],
  MPB: ['Helena Vaz Trio', 'Cantos do Sul', 'Beto Moura & Banda'],
  'Samba e Pagode': ['Roda da Praça', 'Grupo Pé no Chão', 'Samba de Quintal'],
  Sertanejo: ['Duo Serra Azul', 'Tiago & Matheus', 'Viola Caipira Show'],
  Funk: ['MC Pulso', 'Baile do Porto'],
  'Eletrônica': ['DJ Maré Alta', 'Frequência 303', 'Noite Sintética'],
  'Jazz e Blues': ['Quarteto Nublado', 'Blues da Estação', 'Clara Nunes Jazz Duo'],
  'Rap e Hip-Hop': ['Verso Livre', 'Coletivo Rima Sul'],
  'Forró': ['Forró Pé de Serra Lua Cheia', 'Trio Xamego'],
  Reggae: ['Raízes do Sol', 'Ilha Verde Sound'],
  Indie: ['Céu de Papel', 'Os Arquitetos', 'Bicicleta Amarela'],
}

const GENEROS_POR_LOCAL = [
  ['Rock', 'Indie', 'Rap e Hip-Hop', 'Pop', 'Reggae'],
  ['MPB', 'Jazz e Blues', 'Samba e Pagode', 'Pop'],
  ['Eletrônica', 'Funk', 'Sertanejo', 'Rock', 'Forró'],
  ['Samba e Pagode', 'Jazz e Blues', 'Indie', 'MPB', 'Sertanejo'],
]

const DESCRICOES = [
  'Show completo com repertório autoral e os maiores sucessos da carreira.',
  'Noite especial de lançamento do novo álbum, com participações de convidados.',
  'Apresentação intimista com formação acústica. Chegue cedo para garantir lugar.',
  'Turnê comemorativa com cenário novo e repertório escolhido pelo público.',
  'Festa temática com abertura de artistas locais e pista liberada até o fim da noite.',
]

async function main() {
  console.log('Limpando dados antigos...')
  await prisma.interacao.deleteMany()
  await prisma.show.deleteMany()
  await prisma.local.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.genero.deleteMany()
  await prisma.foto.deleteMany()

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)

  const generos = new Map<string, number>()
  for (const nome of GENEROS) {
    const genero = await prisma.genero.create({ data: { nome } })
    generos.set(nome, genero.id)
  }

  const shows: { id: number; genero: string; dataHora: Date }[] = []
  for (const [indice, item] of LOCAIS.entries()) {
    const dados = fs.readFileSync(path.join(__dirname, 'seed-images', item.foto))
    const foto = await prisma.foto.create({ data: { dados: new Uint8Array(dados), tipo: 'image/jpeg' } })

    const admin = await prisma.admin.create({ data: { ...item.admin, senha: senhaHash } })
    const local = await prisma.local.create({
      data: { ...item.local, foto: `/fotos/${foto.id}`, adminId: admin.id },
    })

    const offsets = [-120, -75, -30, 2, 5, 9, 14, 20, 27, 35, 48].map((d) => d + indice)
    for (const dias of offsets) {
      const genero = escolher(GENEROS_POR_LOCAL[indice])
      const show = await prisma.show.create({
        data: {
          atracao: escolher(ATRACOES[genero]),
          dataHora: daquiA(dias, escolher(['19:00', '20:00', '21:00', '21:30', '22:00'])),
          valor: escolher([0, 25, 35, 40, 50, 60, 80, 120]),
          descricao: escolher(DESCRICOES),
          generoId: generos.get(genero)!,
          localId: local.id,
        },
      })
      shows.push({ id: show.id, genero, dataHora: show.dataHora })
    }
  }

  const localPrincipal = await prisma.local.findFirstOrThrow({ where: { nome: 'Galpão 22' } })
  for (const [genero, dias] of [['Rock', 12], ['Rock', 40], ['Eletrônica', 16], ['Eletrônica', 44], ['Sertanejo', 22]] as const) {
    const show = await prisma.show.create({
      data: {
        atracao: escolher(ATRACOES[genero]),
        dataHora: daquiA(dias, '22:00'),
        valor: escolher([30, 45, 60]),
        descricao: escolher(DESCRICOES),
        generoId: generos.get(genero)!,
        localId: localPrincipal.id,
      },
    })
    shows.push({ id: show.id, genero, dataHora: show.dataHora })
  }

  const criarCliente = (nome: string, email: string, preferencias: string[], preferenciasAtivas = true) =>
    prisma.cliente.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        preferenciasAtivas,
        preferencias: { connect: preferencias.map((g) => ({ id: generos.get(g)! })) },
      },
    })

  const ana = await criarCliente('Ana Souza', 'ana@teste.com', ['Rock', 'Indie'])
  const bruno = await criarCliente('Bruno Alves', 'bruno@teste.com', ['Samba e Pagode', 'MPB'])
  await criarCliente('Carla Mendes', 'carla@teste.com', ['Eletrônica'])

  const interacoes: { clienteId: number; showId: number; tipo: TipoInteracao; criadoEm: Date }[] = []
  const adicionar = (clienteId: number, genero: string, tipos: TipoInteracao[], quantidade: number) => {
    const doGenero = shows.filter((s) => s.genero === genero).slice(0, quantidade)
    for (const show of doGenero) {
      for (const tipo of tipos) {
        interacoes.push({ clienteId, showId: show.id, tipo, criadoEm: new Date(Math.min(Date.now(), show.dataHora.getTime()) - inteiro(1, 20) * DIA) })
      }
    }
  }
  adicionar(ana.id, 'Rock', ['VISUALIZOU', 'FAVORITO', 'COMPRA'], 4)
  adicionar(ana.id, 'Indie', ['VISUALIZOU'], 2)
  adicionar(bruno.id, 'Sertanejo', ['VISUALIZOU', 'COMPRA'], 3)
  adicionar(bruno.id, 'Samba e Pagode', ['VISUALIZOU'], 1)

  const nomes = ['Lucas', 'Fernanda', 'Pedro', 'Camila', 'Gabriel', 'Larissa', 'Mateus', 'Beatriz', 'Thiago', 'Isabela', 'Rodrigo', 'Patrícia', 'Felipe', 'Vitória', 'Gustavo', 'Aline', 'Eduardo', 'Natália']
  for (const [i, nome] of nomes.entries()) {
    const favoritos = [escolher(GENEROS), escolher(GENEROS)]
    const cliente = await criarCliente(`${nome} Teste`, `cliente${i + 1}@teste.com`, [...new Set(favoritos)])
    const quantidade = inteiro(4, 12)
    for (let j = 0; j < quantidade; j++) {
      const show = escolher(shows)
      const tipos: TipoInteracao[] = ['VISUALIZOU']
      if (aleatorio() < 0.45) tipos.push('FAVORITO')
      if (aleatorio() < 0.35) tipos.push('COMPRA')
      for (const tipo of tipos) {
        const referencia = Math.min(Date.now(), show.dataHora.getTime())
        interacoes.push({ clienteId: cliente.id, showId: show.id, tipo, criadoEm: new Date(referencia - inteiro(1, 40) * DIA) })
      }
    }
  }

  await prisma.interacao.createMany({ data: interacoes, skipDuplicates: true })

  console.log('Seed concluído!')
  console.log(`  ${generos.size} gêneros | ${LOCAIS.length} locais | ${shows.length} shows | ${3 + nomes.length} clientes | ${interacoes.length} interações`)
  console.log(`  Senha de todos os usuários de teste: ${SENHA_PADRAO}`)
}

main()
  .catch((erro) => {
    console.error('Erro no seed:', erro)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())

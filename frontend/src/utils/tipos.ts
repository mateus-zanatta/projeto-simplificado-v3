export type GeneroType = {
  id: number
  nome: string
}

export type LocalType = {
  id: number
  nome: string
  endereco: string
  numero: string
  bairro: string | null
  cidade: string
  foto: string | null
}

export type ShowType = {
  id: number
  atracao: string
  dataHora: string
  valor: string
  descricao: string
  generoId: number
  genero: GeneroType
  local: LocalType
  _count?: { interacoes: number }
}

export type UsuarioType = {
  id: number
  nome: string
  email: string
  perfil: 'admin' | 'cliente'
  token: string
}

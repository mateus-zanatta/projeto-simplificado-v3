import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { GeneroType } from './utils/tipos'
import { apiUrl } from './utils/formatos'
import { useUsuarioStore } from './context/UsuarioContext'

type Inputs = {
  nome: string
  email: string
  senha: string
}

export default function Acesso() {
  const { usuario, logaUsuario } = useUsuarioStore()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const cadastro = pathname === '/cadastro'

  const [generos, setGeneros] = useState<GeneroType[]>([])
  const [preferencias, setPreferencias] = useState<number[]>([])
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Inputs>()

  useEffect(() => {
    async function buscaGeneros() {
      try {
        const response = await fetch(`${apiUrl}/generos`)
        const dados = await response.json()
        if (!response.ok) {
          toast.error('O servidor não conseguiu acessar o banco de dados. Verifique o .env do back-end.')
          return
        }
        setGeneros(dados)
        if (dados.length === 0) toast.error('Nenhum estilo musical cadastrado. Rode o seed no back-end.')
      } catch {
        toast.error('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.')
      }
    }
    buscaGeneros()
  }, [])

  if (usuario) return <Navigate to={usuario.perfil === 'admin' ? '/admin' : '/'} />

  function alternaGenero(id: number) {
    setPreferencias(preferencias.includes(id) ? preferencias.filter((p) => p !== id) : [...preferencias, id])
  }

  async function enviar(dados: Inputs) {
    if (cadastro && preferencias.length === 0) {
      toast.error('Selecione ao menos um estilo musical')
      return
    }
    const response = await fetch(`${apiUrl}${cadastro ? '/clientes' : '/login/cliente'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cadastro ? { ...dados, preferencias } : { email: dados.email, senha: dados.senha }),
    })
    const resposta = await response.json()
    if (response.ok) {
      logaUsuario(resposta)
      toast.success(`Bem-vindo, ${resposta.nome.split(' ')[0]}!`)
      navigate('/')
    } else {
      toast.error(resposta.erro)
    }
  }

  function trocaAba(destino: string) {
    reset()
    navigate(destino)
  }

  return (
    <main className="container pagina pagina-estreita">
      <div className="abas">
        <button className={!cadastro ? 'ativa' : ''} onClick={() => trocaAba('/entrar')}>Entrar</button>
        <button className={cadastro ? 'ativa' : ''} onClick={() => trocaAba('/cadastro')}>Criar conta</button>
      </div>

      <form className="cartao form" onSubmit={handleSubmit(enviar)}>
        <h1>{cadastro ? 'Crie sua conta' : 'Acesso do cliente'}</h1>

        {cadastro && (
          <label>
            Nome
            <input {...register('nome', { required: 'Informe seu nome', minLength: { value: 2, message: 'Mínimo de 2 caracteres' } })} />
            {errors.nome && <span className="erro">{errors.nome.message}</span>}
          </label>
        )}

        <label>
          E-mail
          <input type="email" {...register('email', { required: 'Informe o e-mail' })} />
          {errors.email && <span className="erro">{errors.email.message}</span>}
        </label>

        <label>
          Senha
          <input type="password" {...register('senha', { required: 'Informe a senha', minLength: cadastro ? { value: 6, message: 'Mínimo de 6 caracteres' } : undefined })} />
          {errors.senha && <span className="erro">{errors.senha.message}</span>}
        </label>

        {cadastro && (
          <div>
            <p className="rotulo">Preferências musicais</p>
            <div className="chips">
              {generos.map((g) => (
                <button type="button" key={g.id} className={`chip ${preferencias.includes(g.id) ? 'ativo' : ''}`} onClick={() => alternaGenero(g.id)}>
                  {g.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primario">{cadastro ? 'Criar conta' : 'Entrar'}</button>
        <p className="texto-apagado">
          É dono de um local? <Link to="/admin/entrar">Acesse o painel</Link>
        </p>
      </form>
    </main>
  )
}

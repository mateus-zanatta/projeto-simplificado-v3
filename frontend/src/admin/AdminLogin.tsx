import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { apiUrl } from '../utils/formatos'
import { useUsuarioStore } from '../context/UsuarioContext'

type Inputs = {
  email: string
  senha: string
}

export default function AdminLogin() {
  const { usuario, logaUsuario } = useUsuarioStore()
  const { register, handleSubmit } = useForm<Inputs>()
  const navigate = useNavigate()

  if (usuario) return <Navigate to={usuario.perfil === 'admin' ? '/admin' : '/'} />

  async function verificaLogin(dados: Inputs) {
    const response = await fetch(`${apiUrl}/login/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    })
    const resposta = await response.json()
    if (response.ok) {
      logaUsuario(resposta)
      navigate('/admin')
    } else {
      toast.error(resposta.erro)
    }
  }

  return (
    <main className="container pagina pagina-estreita">
      <form className="cartao form" onSubmit={handleSubmit(verificaLogin)}>
        <h1>Painel do local</h1>
        <p className="texto-apagado">Área exclusiva para donos de locais de show.</p>
        <label>
          E-mail
          <input type="email" required {...register('email')} />
        </label>
        <label>
          Senha
          <input type="password" required {...register('senha')} />
        </label>
        <button className="btn btn-primario">Entrar</button>
        <p className="texto-apagado">
          Ainda não cadastrou seu local? <Link to="/admin/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </main>
  )
}

import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Music2, X } from 'lucide-react'
import { useUsuarioStore } from '../context/UsuarioContext'

export default function Header() {
  const { usuario, deslogaUsuario } = useUsuarioStore()
  const [aberto, setAberto] = useState(false)
  const navigate = useNavigate()

  function sair() {
    const eraAdmin = usuario?.perfil === 'admin'
    deslogaUsuario()
    navigate(eraAdmin ? '/admin/entrar' : '/')
  }

  return (
    <header className="topo">
      <div className="container topo-conteudo">
        <Link to={usuario?.perfil === 'admin' ? '/admin' : '/'} className="marca">
          <Music2 size={26} /> ShowTime
        </Link>

        <button className="btn-icone menu-celular" onClick={() => setAberto(!aberto)} aria-label="Menu">
          {aberto ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className={`nav ${aberto ? 'nav-aberta' : ''}`} onClick={() => setAberto(false)}>
          {usuario && <span className="nav-usuario">Olá, {usuario.nome.split(' ')[0]}</span>}

          {usuario?.perfil === 'admin' ? (
            <>
              <NavLink to="/admin" end>Painel do local</NavLink>
              <NavLink to="/admin/dashboard">Dashboard</NavLink>
            </>
          ) : (
            <NavLink to="/" end>Shows</NavLink>
          )}

          {usuario?.perfil === 'cliente' && <NavLink to="/minha-conta">Minha conta</NavLink>}

          {usuario ? (
            <button className="nav-link" onClick={sair}>Sair</button>
          ) : (
            <>
              <NavLink to="/admin/entrar">Sou dono de local</NavLink>
              <NavLink to="/entrar">Entrar</NavLink>
              <Link to="/cadastro" className="btn btn-primario">Criar conta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

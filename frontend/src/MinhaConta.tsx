import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import CardShow from './components/CardShow'
import type { GeneroType, ShowType } from './utils/tipos'
import { apiUrl } from './utils/formatos'
import { useUsuarioStore } from './context/UsuarioContext'

type Perfil = {
  nome: string
  email: string
  preferenciasAtivas: boolean
  preferencias: GeneroType[]
}

export default function MinhaConta() {
  const { usuario, deslogaUsuario } = useUsuarioStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') || 'ingressos'

  const [agenda, setAgenda] = useState<{ ingressos: ShowType[]; favoritos: ShowType[] }>({ ingressos: [], favoritos: [] })
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [generos, setGeneros] = useState<GeneroType[]>([])
  const [selecionados, setSelecionados] = useState<number[]>([])

  useEffect(() => {
    if (!usuario) return
    const headers = { Authorization: `Bearer ${usuario.token}` }

    async function buscaDados() {
      const response = await fetch(`${apiUrl}/clientes/agenda`, { headers })
      if (response.status === 401) {
        deslogaUsuario()
        navigate('/entrar')
        return
      }
      setAgenda(await response.json())

      const respPerfil = await fetch(`${apiUrl}/clientes/perfil`, { headers })
      const dados = await respPerfil.json()
      setPerfil(dados)
      setSelecionados(dados.preferencias.map((g: GeneroType) => g.id))

      const respGeneros = await fetch(`${apiUrl}/generos`)
      if (respGeneros.ok) setGeneros(await respGeneros.json())
    }
    buscaDados()
  }, [usuario, deslogaUsuario, navigate])

  if (!usuario || usuario.perfil !== 'cliente') return <Navigate to="/entrar" />

  async function salvaPreferencias(dados: { ativas?: boolean; generoIds?: number[] }) {
    const response = await fetch(`${apiUrl}/clientes/preferencias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${usuario!.token}` },
      body: JSON.stringify(dados),
    })
    const resposta = await response.json()
    if (response.ok) {
      setPerfil(resposta)
      toast.success('Preferências atualizadas!')
    } else {
      toast.error(resposta.erro)
    }
  }

  function alternaGenero(id: number) {
    setSelecionados(selecionados.includes(id) ? selecionados.filter((s) => s !== id) : [...selecionados, id])
  }

  async function baixaIngresso(show: ShowType) {
    const { geraIngresso } = await import('./utils/ingresso')
    await geraIngresso(show, usuario!.nome)
  }

  const lista = aba === 'favoritos' ? agenda.favoritos : agenda.ingressos

  return (
    <main className="container pagina">
      <h1 className="titulo-pagina">Minha conta</h1>

      <div className="abas">
        <button className={aba === 'ingressos' ? 'ativa' : ''} onClick={() => setParams({ aba: 'ingressos' })}>Meus ingressos</button>
        <button className={aba === 'favoritos' ? 'ativa' : ''} onClick={() => setParams({ aba: 'favoritos' })}>Favoritos</button>
        <button className={aba === 'perfil' ? 'ativa' : ''} onClick={() => setParams({ aba: 'perfil' })}>Perfil e preferências</button>
      </div>

      {aba !== 'perfil' && (
        <>
          {lista.length === 0 && <p className="vazio">Nenhum show por aqui ainda.</p>}
          <div className="grade">
            {lista.map((show) => (
              <div key={show.id} className="item-ingresso">
                <CardShow show={show} />
                {aba === 'ingressos' && (
                  <button className="btn btn-secundario" onClick={() => baixaIngresso(show)}>Baixar ingresso</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {aba === 'perfil' && perfil && (
        <div className="cartao form">
          <p><strong>{perfil.nome}</strong> · {perfil.email}</p>

          <div className="toggle-linha">
            <div>
              <strong>Usar minhas preferências</strong>
              <p className="texto-apagado">
                {perfil.preferenciasAtivas ? 'Ligado: seus estilos aparecem primeiro na agenda.' : 'Desligado: a agenda mostra todos os shows por data.'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={perfil.preferenciasAtivas}
              className={`toggle ${perfil.preferenciasAtivas ? 'ligado' : ''}`}
              onClick={() => salvaPreferencias({ ativas: !perfil.preferenciasAtivas })}
            >
              <span></span>
            </button>
          </div>

          <p className="rotulo">Meus estilos</p>
          <div className="chips">
            {generos.map((g) => (
              <button key={g.id} className={`chip ${selecionados.includes(g.id) ? 'ativo' : ''}`} onClick={() => alternaGenero(g.id)}>
                {g.nome}
              </button>
            ))}
          </div>
          <button className="btn btn-primario" onClick={() => salvaPreferencias({ generoIds: selecionados })}>Salvar estilos</button>
        </div>
      )}
    </main>
  )
}

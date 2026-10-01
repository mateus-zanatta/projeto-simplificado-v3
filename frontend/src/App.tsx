import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import CardShow from './components/CardShow'
import Recomendacoes from './components/Recomendacoes'
import type { GeneroType, ShowType } from './utils/tipos'
import { apiUrl } from './utils/formatos'
import { useUsuarioStore } from './context/UsuarioContext'

export default function App() {
  const { usuario } = useUsuarioStore()
  const [preferidos, setPreferidos] = useState<ShowType[]>([])
  const [outros, setOutros] = useState<ShowType[]>([])
  const [priorizado, setPriorizado] = useState(false)
  const [generos, setGeneros] = useState<GeneroType[]>([])
  const [busca, setBusca] = useState('')
  const [generoId, setGeneroId] = useState(0)

  useEffect(() => {
    async function buscaGeneros() {
      const response = await fetch(`${apiUrl}/generos`)
      if (response.ok) setGeneros(await response.json())
    }
    buscaGeneros()
  }, [])

  useEffect(() => {
    async function buscaShows() {
      const params = new URLSearchParams()
      if (busca) params.append('busca', busca)
      if (generoId) params.append('generoId', String(generoId))
      const response = await fetch(`${apiUrl}/shows?${params}`, {
        headers: usuario ? { Authorization: `Bearer ${usuario.token}` } : {},
      })
      if (!response.ok) return
      const dados = await response.json()
      setPreferidos(dados.preferidos)
      setOutros(dados.outros)
      setPriorizado(dados.priorizado)
    }
    const timer = setTimeout(buscaShows, 300)
    return () => clearTimeout(timer)
  }, [busca, generoId, usuario])

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>
            A próxima noite <em>inesquecível</em> começa aqui.
          </h1>
          <p>Shows de todos os locais da cidade, com recomendações para o seu gosto.</p>
          <label className="busca">
            <Search size={20} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busque por atração, local ou cidade..." />
          </label>
          <div className="chips">
            {generos.map((g) => (
              <button key={g.id} className={`chip ${generoId === g.id ? 'ativo' : ''}`} onClick={() => setGeneroId(generoId === g.id ? 0 : g.id)}>
                {g.nome}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="container pagina">
        <Recomendacoes />

        <h2 className="titulo-secao">Agenda completa</h2>

        {usuario?.perfil === 'cliente' && (
          <p className="aviso">
            {priorizado ? 'Os shows dos seus estilos aparecem primeiro.' : 'Preferências desligadas: shows por data.'}{' '}
            <Link to="/minha-conta?aba=perfil">Alterar</Link>
          </p>
        )}

        {preferidos.length > 0 && (
          <>
            <h3 className="subtitulo">Dos seus estilos</h3>
            <div className="grade">
              {preferidos.map((show) => <CardShow key={show.id} show={show} />)}
            </div>
            <h3 className="subtitulo">Outros shows</h3>
          </>
        )}

        <div className="grade">
          {outros.map((show) => <CardShow key={show.id} show={show} />)}
        </div>

        {preferidos.length === 0 && outros.length === 0 && <p className="vazio">Nenhum show encontrado.</p>}
      </main>
    </>
  )
}

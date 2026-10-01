import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import CardShow from './CardShow'
import type { GeneroType, ShowType } from '../utils/tipos'
import { apiUrl } from '../utils/formatos'
import { useUsuarioStore } from '../context/UsuarioContext'

type Recomendacao = {
  modo: 'ia' | 'fallback' | 'geral'
  genero: GeneroType | null
  justificativa: string
  shows: ShowType[]
}

export default function Recomendacoes() {
  const { usuario } = useUsuarioStore()
  const [rec, setRec] = useState<Recomendacao | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function buscaRecomendacoes() {
      try {
        const response = await fetch(`${apiUrl}/recomendacoes`, {
          headers: usuario ? { Authorization: `Bearer ${usuario.token}` } : {},
        })
        setRec(await response.json())
      } catch {
        setRec(null)
      }
      setCarregando(false)
    }
    buscaRecomendacoes()
  }, [usuario])

  if (carregando) {
    return (
      <section className="ia-bloco">
        <div className="ia-carregando">
          <span className="spinner"></span>
          <div>
            <h2>Buscando recomendações para você...</h2>
            <p className="texto-apagado">A IA está analisando os shows do seu estilo favorito.</p>
          </div>
        </div>
      </section>
    )
  }

  if (!rec || !rec.shows) return null

  return (
    <section className="ia-bloco">
      <div className="ia-topo">
        <div>
          <span className="badge badge-destaque">
            <Sparkles size={13} />
            {rec.modo === 'ia' ? ' Recomendado por IA' : rec.modo === 'fallback' ? ' Seleção automática' : ' Agenda'}
          </span>
          <h2>{rec.genero ? `Para você: ${rec.genero.nome}` : 'Próximos shows'}</h2>
        </div>
        <p className="ia-frase">{rec.justificativa}</p>
      </div>
      <div className="grade">
        {rec.shows.map((show) => (
          <CardShow key={show.id} show={show} />
        ))}
      </div>
    </section>
  )
}

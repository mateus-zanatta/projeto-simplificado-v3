import { Link } from 'react-router-dom'
import { CalendarDays, MapPin } from 'lucide-react'
import type { ShowType } from '../utils/tipos'
import { formataData, formataPreco, urlFoto } from '../utils/formatos'

export default function CardShow({ show }: { show: ShowType }) {
  return (
    <Link to={`/shows/${show.id}`} className="card-show">
      <img src={urlFoto(show.local.foto)} alt={show.local.nome} />
      <div className="card-show-corpo">
        <span className="badge">{show.genero.nome}</span>
        <h3>{show.atracao}</h3>
        <p className="info">
          <CalendarDays size={16} /> {formataData(show.dataHora)}
        </p>
        <p className="info">
          <MapPin size={16} /> {show.local.nome} · {show.local.cidade}
        </p>
        <p className="preco">{formataPreco(show.valor)}</p>
      </div>
    </Link>
  )
}

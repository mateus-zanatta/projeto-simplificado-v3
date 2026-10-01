import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Download, Heart, MapPin, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import type { ShowType } from './utils/tipos'
import { apiUrl, formataData, formataPreco, urlFoto } from './utils/formatos'
import { useUsuarioStore } from './context/UsuarioContext'

export default function Detalhes() {
  const { id } = useParams()
  const { usuario } = useUsuarioStore()
  const [show, setShow] = useState<ShowType | null>(null)
  const [comprado, setComprado] = useState(false)
  const [favorito, setFavorito] = useState(false)

  const ehCliente = usuario?.perfil === 'cliente'

  useEffect(() => {
    async function buscaShow() {
      const response = await fetch(`${apiUrl}/shows/${id}`)
      setShow(await response.json())
    }
    buscaShow()

    async function buscaMarcacoes() {
      const headers = { Authorization: `Bearer ${usuario!.token}` }
      await fetch(`${apiUrl}/clientes/interacoes/${id}/visualizou`, { method: 'PUT', headers })
      const response = await fetch(`${apiUrl}/clientes/agenda`, { headers })
      const agenda = await response.json()
      setComprado(agenda.ingressos.some((s: ShowType) => s.id === Number(id)))
      setFavorito(agenda.favoritos.some((s: ShowType) => s.id === Number(id)))
    }
    if (ehCliente) buscaMarcacoes()
  }, [id, usuario, ehCliente])

  async function alternaFavorito() {
    const response = await fetch(`${apiUrl}/clientes/interacoes/${id}/favorito`, {
      method: favorito ? 'DELETE' : 'PUT',
      headers: { Authorization: `Bearer ${usuario!.token}` },
    })
    if (response.status !== 204) {
      toast.error('Não foi possível salvar. Faça login novamente.')
      return
    }
    if (!favorito) toast.success('Adicionado aos favoritos!')
    setFavorito(!favorito)
  }

  async function comprar() {
    if (!comprado) {
      const response = await fetch(`${apiUrl}/clientes/interacoes/${id}/compra`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${usuario!.token}` },
      })
      if (response.status !== 204) {
        toast.error('Não foi possível concluir a compra. Faça login novamente.')
        return
      }
      setComprado(true)
      toast.success('Ingresso comprado! Pague com o PIX do PDF.')
    }
    const { geraIngresso } = await import('./utils/ingresso')
    await geraIngresso(show!, usuario!.nome)
  }

  if (!show) return <p className="carregando">Carregando...</p>

  return (
    <main className="container pagina">
      <Link to="/" className="voltar">← Voltar para a agenda</Link>
      <div className="detalhe">
        <img src={urlFoto(show.local.foto)} alt={show.local.nome} />
        <div>
          <span className="badge badge-destaque">{show.genero.nome}</span>
          <h1>{show.atracao}</h1>
          <p className="texto-suave">{show.descricao}</p>

          <div className="caixa">
            <p className="info"><CalendarDays size={18} /> {formataData(show.dataHora)}</p>
            <p className="info"><Ticket size={18} /> {formataPreco(show.valor)}</p>
            <p className="info"><MapPin size={18} /> {show.local.nome} — {show.local.endereco}, {show.local.numero}{show.local.bairro && ` – ${show.local.bairro}`} · {show.local.cidade}</p>
          </div>

          {ehCliente ? (
            <div className="acoes">
              <button className={`btn ${comprado ? 'btn-secundario marcado' : 'btn-primario'}`} onClick={comprar}>
                {comprado ? <><Download size={18} /> Baixar ingresso</> : <><Ticket size={18} /> Comprar ingresso</>}
              </button>
              <button className={`btn btn-secundario ${favorito ? 'marcado' : ''}`} onClick={alternaFavorito}>
                <Heart size={18} /> {favorito ? 'Favoritado' : 'Favoritar'}
              </button>
            </div>
          ) : (
            !usuario && <p className="aviso"><Link to="/entrar">Entre</Link> para comprar ingressos e favoritar.</p>
          )}
        </div>
      </div>
    </main>
  )
}

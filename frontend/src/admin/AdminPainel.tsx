import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import FormShow, { type ShowInputs, type ShowPayload } from '../components/FormShow'
import type { GeneroType, LocalType, ShowType } from '../utils/tipos'
import { apiUrl, formataData, formataPreco, separaDataHora, urlFoto, validaFoto } from '../utils/formatos'
import { useUsuarioStore } from '../context/UsuarioContext'

type LocalInputs = {
  localNome: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  foto: FileList
}

export default function AdminPainel() {
  const { usuario } = useUsuarioStore()
  const [local, setLocal] = useState<LocalType | null>(null)
  const [shows, setShows] = useState<ShowType[]>([])
  const [generos, setGeneros] = useState<GeneroType[]>([])
  const [editandoShow, setEditandoShow] = useState<ShowType | 'novo' | null>(null)
  const [editandoLocal, setEditandoLocal] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LocalInputs>()

  const token = usuario?.token

  useEffect(() => {
    if (!token) return
    async function buscaDados() {
      const headers = { Authorization: `Bearer ${token}` }
      const respLocal = await fetch(`${apiUrl}/admins/local`, { headers })
      setLocal(await respLocal.json())
      const respShows = await fetch(`${apiUrl}/shows/admin`, { headers })
      setShows(await respShows.json())
      const respGeneros = await fetch(`${apiUrl}/generos`)
      if (respGeneros.ok) setGeneros(await respGeneros.json())
    }
    buscaDados()
  }, [token])

  if (!usuario || usuario.perfil !== 'admin') return <Navigate to="/admin/entrar" />

  async function recarregaShows() {
    const response = await fetch(`${apiUrl}/shows/admin`, { headers: { Authorization: `Bearer ${token}` } })
    setShows(await response.json())
  }

  async function salvaShow(show: ShowPayload) {
    const novo = editandoShow === 'novo'
    const response = await fetch(`${apiUrl}/shows${novo ? '' : `/${(editandoShow as ShowType).id}`}`, {
      method: novo ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(show),
    })
    if (response.ok) {
      toast.success(novo ? 'Show cadastrado!' : 'Show alterado!')
      setEditandoShow(null)
      recarregaShows()
    } else {
      toast.error((await response.json()).erro)
    }
  }

  async function excluiShow(show: ShowType) {
    if (!confirm(`Confirma a exclusão do show "${show.atracao}"?`)) return
    const response = await fetch(`${apiUrl}/shows/${show.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.ok) {
      toast.success('Show excluído!')
      setShows(shows.filter((s) => s.id !== show.id))
    } else {
      toast.error((await response.json()).erro)
    }
  }

  function abreEdicaoLocal() {
    reset({ localNome: local!.nome, endereco: local!.endereco, numero: local!.numero, bairro: local!.bairro ?? '', cidade: local!.cidade })
    setEditandoLocal(true)
  }

  async function salvaLocal(dados: LocalInputs) {
    const formData = new FormData()
    formData.append('localNome', dados.localNome)
    formData.append('endereco', dados.endereco)
    formData.append('numero', dados.numero)
    formData.append('bairro', dados.bairro)
    formData.append('cidade', dados.cidade)
    if (dados.foto?.[0]) formData.append('foto', dados.foto[0])

    const response = await fetch(`${apiUrl}/admins/local`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const resposta = await response.json()
    if (response.ok) {
      setLocal(resposta)
      setEditandoLocal(false)
      toast.success('Local atualizado!')
    } else {
      toast.error(resposta.erro)
    }
  }

  function dadosIniciais(show: ShowType): ShowInputs {
    const { data, horario } = separaDataHora(show.dataHora)
    return { atracao: show.atracao, data, horario, generoId: String(show.generoId), valor: String(Number(show.valor)), descricao: show.descricao }
  }

  return (
    <main className="container pagina">
      {local && (
        <div className="local-card">
          <img src={urlFoto(local.foto)} alt={local.nome} />
          <div>
            <h1>{local.nome}</h1>
            <p className="texto-suave">
              {local.endereco}, {local.numero}{local.bairro && ` – ${local.bairro}`} · {local.cidade}
            </p>
          </div>
          <button className="btn btn-secundario" onClick={abreEdicaoLocal}>Editar local</button>
        </div>
      )}

      <div className="titulo-linha">
        <h2>Agenda de shows</h2>
        <button className="btn btn-primario" onClick={() => setEditandoShow('novo')}>Novo show</button>
      </div>

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Atração</th>
              <th>Data</th>
              <th>Gênero</th>
              <th>Valor</th>
              <th>Interações</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shows.map((show) => (
              <tr key={show.id} className={new Date(show.dataHora) < new Date() ? 'passado' : ''}>
                <td data-rotulo="Atração"><strong>{show.atracao}</strong></td>
                <td data-rotulo="Data">{formataData(show.dataHora)}</td>
                <td data-rotulo="Gênero">{show.genero.nome}</td>
                <td data-rotulo="Valor">{formataPreco(show.valor)}</td>
                <td data-rotulo="Interações">{show._count?.interacoes}</td>
                <td className="acoes-tabela">
                  <button className="btn btn-secundario" onClick={() => setEditandoShow(show)}>Editar</button>
                  <button className="btn btn-perigo" onClick={() => excluiShow(show)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editandoShow && (
        <div className="modal-fundo">
          <div className="modal">
            <h2>{editandoShow === 'novo' ? 'Novo show' : 'Editar show'}</h2>
            <FormShow
              generos={generos}
              inicial={editandoShow === 'novo' ? undefined : dadosIniciais(editandoShow)}
              textoBotao="Salvar"
              onSalvar={salvaShow}
              onCancelar={() => setEditandoShow(null)}
            />
          </div>
        </div>
      )}

      {editandoLocal && (
        <div className="modal-fundo">
          <form className="modal form" onSubmit={handleSubmit(salvaLocal)}>
            <h2>Editar local</h2>
            <label>
              Nome do local
              <input {...register('localNome', { required: 'Informe o nome do local' })} />
              {errors.localNome && <span className="erro">{errors.localNome.message}</span>}
            </label>
            <div className="linha">
              <label>
                Endereço
                <input {...register('endereco', { required: 'Informe o endereço' })} />
                {errors.endereco && <span className="erro">{errors.endereco.message}</span>}
              </label>
              <label>
                Número
                <input {...register('numero', { required: 'Informe o número' })} />
              </label>
            </div>
            <div className="linha">
              <label>
                Bairro
                <input {...register('bairro')} />
              </label>
              <label>
                Cidade
                <input {...register('cidade', { required: 'Informe a cidade' })} />
              </label>
            </div>
            <label>
              Nova foto (opcional)
              <input type="file" accept="image/jpeg,image/png,image/webp" {...register('foto', { validate: (f) => validaFoto(f, false) })} />
              {errors.foto && <span className="erro">{errors.foto.message}</span>}
            </label>
            <div className="acoes">
              <button type="button" className="btn btn-secundario" onClick={() => setEditandoLocal(false)}>Cancelar</button>
              <button className="btn btn-primario">Salvar</button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}

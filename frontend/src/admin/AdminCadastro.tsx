import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import FormShow, { type ShowPayload } from '../components/FormShow'
import type { GeneroType } from '../utils/tipos'
import { apiUrl, formataPreco, validaFoto } from '../utils/formatos'
import { useUsuarioStore } from '../context/UsuarioContext'

type Inputs = {
  nome: string
  email: string
  senha: string
  localNome: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  foto: FileList
}

export default function AdminCadastro() {
  const { usuario, logaUsuario } = useUsuarioStore()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm<Inputs>()
  const [generos, setGeneros] = useState<GeneroType[]>([])
  const [shows, setShows] = useState<ShowPayload[]>([])
  const [novoShow, setNovoShow] = useState(false)

  useEffect(() => {
    async function buscaGeneros() {
      const response = await fetch(`${apiUrl}/generos`)
      if (response.ok) setGeneros(await response.json())
    }
    buscaGeneros()
  }, [])

  if (usuario) return <Navigate to={usuario.perfil === 'admin' ? '/admin' : '/'} />

  async function cadastrar(dados: Inputs) {
    const formData = new FormData()
    formData.append('nome', dados.nome)
    formData.append('email', dados.email)
    formData.append('senha', dados.senha)
    formData.append('localNome', dados.localNome)
    formData.append('endereco', dados.endereco)
    formData.append('numero', dados.numero)
    formData.append('bairro', dados.bairro)
    formData.append('cidade', dados.cidade)
    formData.append('foto', dados.foto[0])
    formData.append('shows', JSON.stringify(shows))

    const response = await fetch(`${apiUrl}/admins`, { method: 'POST', body: formData })
    const resposta = await response.json()
    if (response.ok) {
      logaUsuario(resposta)
      toast.success('Local cadastrado!')
      navigate('/admin')
    } else {
      toast.error(resposta.erro)
    }
  }

  return (
    <main className="container pagina pagina-media">
      <form className="cartao form" onSubmit={handleSubmit(cadastrar)}>
        <h1>Cadastre o seu local</h1>

        <h2>Dados de acesso</h2>
        <label>
          Seu nome
          <input {...register('nome', { required: 'Informe seu nome' })} />
          {errors.nome && <span className="erro">{errors.nome.message}</span>}
        </label>
        <div className="linha">
          <label>
            E-mail
            <input type="email" {...register('email', { required: 'Informe o e-mail' })} />
            {errors.email && <span className="erro">{errors.email.message}</span>}
          </label>
          <label>
            Senha
            <input type="password" {...register('senha', { required: 'Informe a senha', minLength: { value: 6, message: 'Mínimo de 6 caracteres' } })} />
            {errors.senha && <span className="erro">{errors.senha.message}</span>}
          </label>
        </div>

        <h2>Local</h2>
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
            {errors.numero && <span className="erro">{errors.numero.message}</span>}
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
            {errors.cidade && <span className="erro">{errors.cidade.message}</span>}
          </label>
        </div>
        <label>
          Foto do local (JPG, PNG ou WEBP até 2 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp" {...register('foto', { validate: (f) => validaFoto(f, true) })} />
          {errors.foto && <span className="erro">{errors.foto.message}</span>}
        </label>

        <h2>Agenda de shows (opcional)</h2>
        {shows.map((show, i) => (
          <div key={i} className="item-lista">
            <span>
              <strong>{show.atracao}</strong> · {show.data.split('-').reverse().join('/')} {show.horario} · {formataPreco(show.valor)}
            </span>
            <button type="button" className="btn btn-perigo" onClick={() => setShows(shows.filter((_, j) => j !== i))}>Remover</button>
          </div>
        ))}

        {novoShow ? (
          <div className="caixa">
            <FormShow
              generos={generos}
              textoBotao="Adicionar"
              onSalvar={(show) => {
                setShows([...shows, show])
                setNovoShow(false)
              }}
              onCancelar={() => setNovoShow(false)}
            />
          </div>
        ) : (
          <button type="button" className="btn btn-secundario" onClick={() => setNovoShow(true)}>+ Adicionar show</button>
        )}

        <button className="btn btn-primario">Cadastrar local</button>
      </form>
    </main>
  )
}

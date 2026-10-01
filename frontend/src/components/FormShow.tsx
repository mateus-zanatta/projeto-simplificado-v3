import { useForm } from 'react-hook-form'
import type { GeneroType } from '../utils/tipos'

export type ShowInputs = {
  atracao: string
  data: string
  horario: string
  generoId: string
  valor: string
  descricao: string
}

export type ShowPayload = {
  atracao: string
  data: string
  horario: string
  generoId: number
  valor: number
  descricao: string
}

type Props = {
  generos: GeneroType[]
  inicial?: ShowInputs
  textoBotao: string
  onSalvar: (show: ShowPayload) => void
  onCancelar: () => void
}

export default function FormShow({ generos, inicial, textoBotao, onSalvar, onCancelar }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<ShowInputs>({ defaultValues: inicial })

  function enviar(dados: ShowInputs) {
    onSalvar({ ...dados, generoId: Number(dados.generoId), valor: Number(dados.valor.replace(',', '.')) })
  }

  return (
    <div className="form">
      <label>
        Atração
        <input {...register('atracao', { required: 'Informe a atração', minLength: { value: 2, message: 'Mínimo de 2 caracteres' } })} />
        {errors.atracao && <span className="erro">{errors.atracao.message}</span>}
      </label>

      <div className="linha">
        <label>
          Data
          <input type="date" {...register('data', { required: 'Informe a data' })} />
          {errors.data && <span className="erro">{errors.data.message}</span>}
        </label>
        <label>
          Horário
          <input type="time" {...register('horario', { required: 'Informe o horário' })} />
          {errors.horario && <span className="erro">{errors.horario.message}</span>}
        </label>
      </div>

      <div className="linha">
        <label>
          Gênero musical
          <select {...register('generoId', { required: 'Selecione o gênero' })}>
            <option value="">Selecione...</option>
            {generos.map((g) => (
              <option key={g.id} value={g.id}>{g.nome}</option>
            ))}
          </select>
          {errors.generoId && <span className="erro">{errors.generoId.message}</span>}
        </label>
        <label>
          Valor (R$)
          <input
            placeholder="0 para gratuito"
            {...register('valor', {
              required: 'Informe o valor',
              pattern: { value: /^\d+([.,]\d{1,2})?$/, message: 'Valor inválido' },
            })}
          />
          {errors.valor && <span className="erro">{errors.valor.message}</span>}
        </label>
      </div>

      <label>
        Descrição
        <textarea rows={4} {...register('descricao', { required: 'Informe a descrição', minLength: { value: 10, message: 'Mínimo de 10 caracteres' } })} />
        {errors.descricao && <span className="erro">{errors.descricao.message}</span>}
      </label>

      <div className="acoes">
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="btn btn-primario" onClick={handleSubmit(enviar)}>{textoBotao}</button>
      </div>
    </div>
  )
}

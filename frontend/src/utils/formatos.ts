export const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function urlFoto(foto: string | null) {
  if (!foto) return ''
  return foto.startsWith('http') ? foto : `${apiUrl}${foto}`
}

export function formataPreco(valor: string | number) {
  if (Number(valor) === 0) return 'Gratuito'
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formataData(dataHora: string) {
  return new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function separaDataHora(dataHora: string) {
  const [data, hora] = new Date(dataHora).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).split(' ')
  return { data, horario: hora.slice(0, 5) }
}

export function validaFoto(arquivos: FileList, obrigatoria: boolean) {
  const foto = arquivos?.[0]
  if (!foto) return obrigatoria ? 'Envie a foto do local' : true
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(foto.type)) return 'Envie uma imagem JPG, PNG ou WEBP'
  if (foto.size > 2 * 1024 * 1024) return 'A imagem deve ter no máximo 2 MB'
  return true
}

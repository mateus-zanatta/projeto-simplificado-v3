import { z } from 'zod'

type ShowParaIA = { id: number; atracao: string; data: string; local: string; descricao: string }

function montarRequisicao(sistema: string, usuario: string) {
  return {
    url: process.env.AI_API_ENDPOINT as string,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: {
      model: process.env.AI_MODEL || 'gemini-3.6-flash',
      temperature: 0.3,
      messages: [
        { role: 'system', content: sistema },
        { role: 'user', content: usuario },
      ],
    },
  }
}

function extrairTexto(resposta: any): string {
  return resposta.choices[0].message.content
}

const respostaSchema = z.object({
  ids: z.array(z.number()).min(1),
  justificativa: z.string().min(5),
})

export async function recomendarComIA(genero: string, shows: ShowParaIA[]) {
  if (!process.env.AI_API_ENDPOINT || !process.env.AI_API_KEY) {
    throw new Error('IA não configurada no .env')
  }

  const sistema = `Você recomenda shows de uma agenda. Escolha de 1 a 4 shows da lista, somente do gênero ${genero}.
Use apenas ids da lista. Responda SOMENTE com JSON no formato:
{"ids": [numeros], "justificativa": "frase curta em português para o cliente"}`

  const req = montarRequisicao(sistema, JSON.stringify({ genero, shows }))

  const resposta = await fetch(req.url, {
    method: 'POST',
    headers: req.headers,
    body: JSON.stringify(req.body),
    signal: AbortSignal.timeout(Number(process.env.AI_TIMEOUT_MS) || 15000),
  })
  if (!resposta.ok) {
    throw new Error(`IA respondeu com status ${resposta.status}`)
  }

  const texto = extrairTexto(await resposta.json())
  const json = JSON.parse(texto.slice(texto.indexOf('{'), texto.lastIndexOf('}') + 1))
  const dados = respostaSchema.parse(json)

  const ids = dados.ids.filter((id) => shows.some((s) => s.id === id))
  if (ids.length === 0) throw new Error('IA não recomendou shows da lista')

  return { ids, justificativa: dados.justificativa }
}

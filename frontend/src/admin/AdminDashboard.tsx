import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryScatter, VictoryTooltip, VictoryVoronoiContainer } from 'victory'
import { apiUrl } from '../utils/formatos'
import { useUsuarioStore } from '../context/UsuarioContext'

type Dashboard = {
  gerais: { shows: number; proximos: number; vendas: number; favoritos: number; visualizacoes: number }
  porGenero: { genero: string; num: number }[]
  meses: { mes: string; vendas: number; visualizacoes: number }[]
}

const cor = (nome: string) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim()

export default function AdminDashboard() {
  const { usuario } = useUsuarioStore()
  const [dados, setDados] = useState<Dashboard | null>(null)
  const token = usuario?.token

  useEffect(() => {
    if (!token) return
    async function buscaDados() {
      const response = await fetch(`${apiUrl}/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      setDados(await response.json())
    }
    buscaDados()
  }, [token])

  if (!usuario || usuario.perfil !== 'admin') return <Navigate to="/admin/entrar" />
  if (!dados) return <p className="carregando">Carregando...</p>

  const eixo = {
    axis: { stroke: cor('--azul') },
    grid: { stroke: cor('--azul') },
    tickLabels: { fill: cor('--texto-apagado'), fontSize: 11 },
  }

  return (
    <main className="container pagina">
      <h1 className="titulo-pagina">Dashboard</h1>

      <div className="kpis">
        <div className="kpi"><span>Próximos shows</span><strong>{dados.gerais.proximos}</strong></div>
        <div className="kpi"><span>Ingressos vendidos</span><strong>{dados.gerais.vendas}</strong></div>
        <div className="kpi"><span>Favoritos</span><strong>{dados.gerais.favoritos}</strong></div>
        <div className="kpi"><span>Visualizações</span><strong>{dados.gerais.visualizacoes}</strong></div>
      </div>

      <div className="graficos">
        <div className="cartao">
          <h2>Interações por mês</h2>
          <p className="legenda">
            <span style={{ background: cor('--grafico-1') }}></span> Ingressos vendidos
            <span style={{ background: cor('--grafico-2') }}></span> Visualizações
          </p>
          <VictoryChart
            height={260}
            padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
            containerComponent={<VictoryVoronoiContainer labels={({ datum }) => `${datum.y}`} labelComponent={<VictoryTooltip />} />}
          >
            <VictoryAxis style={eixo} />
            <VictoryAxis dependentAxis style={eixo} tickFormat={(t: number) => (Number.isInteger(t) ? t : '')} />
            <VictoryLine data={dados.meses.map((m) => ({ x: m.mes, y: m.vendas }))} style={{ data: { stroke: cor('--grafico-1'), strokeWidth: 2 } }} />
            <VictoryScatter data={dados.meses.map((m) => ({ x: m.mes, y: m.vendas }))} size={4} style={{ data: { fill: cor('--grafico-1') } }} />
            <VictoryLine data={dados.meses.map((m) => ({ x: m.mes, y: m.visualizacoes }))} style={{ data: { stroke: cor('--grafico-2'), strokeWidth: 2 } }} />
            <VictoryScatter data={dados.meses.map((m) => ({ x: m.mes, y: m.visualizacoes }))} size={4} style={{ data: { fill: cor('--grafico-2') } }} />
          </VictoryChart>
        </div>

        <div className="cartao">
          <h2>Ingressos vendidos por gênero</h2>
          <VictoryChart height={260} domainPadding={{ x: 20 }} padding={{ top: 20, bottom: 40, left: 110, right: 40 }}>
            <VictoryAxis style={eixo} />
            <VictoryAxis dependentAxis style={eixo} tickFormat={(t: number) => (Number.isInteger(t) ? t : '')} />
            <VictoryBar
              horizontal
              data={dados.porGenero}
              x="genero"
              y="num"
              labels={({ datum }) => datum.num}
              barWidth={14}
              cornerRadius={{ top: 4 }}
              style={{ data: { fill: cor('--grafico-1') }, labels: { fill: cor('--texto'), fontSize: 11 } }}
            />
          </VictoryChart>
        </div>
      </div>
    </main>
  )
}

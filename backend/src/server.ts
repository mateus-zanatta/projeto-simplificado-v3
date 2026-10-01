import 'dotenv/config'
import fs from 'node:fs'
import express from 'express'
import cors from 'cors'
import swaggerUi from 'swagger-ui-express'

import routesLogin from './routes/login'
import routesClientes from './routes/clientes'
import routesAdmins from './routes/admins'
import routesShows from './routes/shows'
import routesGeneros from './routes/generos'
import routesDashboard from './routes/dashboard'
import routesRecomendacoes from './routes/recomendacoes'
import routesFotos from './routes/fotos'

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

if (fs.existsSync('./swagger-output.json')) {
  const swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf8'))
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}

app.use('/login', routesLogin)
app.use('/clientes', routesClientes)
app.use('/admins', routesAdmins)
app.use('/shows', routesShows)
app.use('/generos', routesGeneros)
app.use('/dashboard', routesDashboard)
app.use('/recomendacoes', routesRecomendacoes)
app.use('/fotos', routesFotos)

app.get('/', (req, res) => {
  // #swagger.ignore = true
  res.send('API: Agenda de Shows')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})

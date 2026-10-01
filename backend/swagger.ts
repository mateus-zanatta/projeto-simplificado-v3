import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: {
    title: 'API Agenda de Shows',
    description: 'Documentação da API da Agenda de Shows. Faça login, copie o token e clique em Authorize.',
    version: '1.0.0',
  },
  servers: [{ url: '/' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
}

const outputFile = './swagger-output.json'
const routes = ['./src/server.ts']

swaggerAutogen({ openapi: '3.0.0' })(outputFile, routes, doc)

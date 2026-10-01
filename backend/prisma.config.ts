// Configuração do Prisma CLI (Prisma 7).
// A URL do banco NUNCA fica no código: é lida da variável DATABASE_URL do .env.
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // Executado por "npx prisma db seed" e após "prisma migrate reset"
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // "?? ''" permite rodar "prisma generate" (no npm install) mesmo antes de criar o .env
    url: process.env.DATABASE_URL ?? '',
  },
})

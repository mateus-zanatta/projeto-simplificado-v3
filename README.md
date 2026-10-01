# ShowTime — Agenda de Shows

Trabalho de Programação Full Stack. Donos de locais cadastram a agenda de shows do seu espaço e os clientes encontram shows de todos os locais, com recomendação por IA do gênero que mais consomem.

- **Back-end:** Node.js, Express, TypeScript, Prisma (PostgreSQL), Zod, JWT, bcrypt, Multer, Swagger
- **Front-end:** React, Vite, TypeScript, React Router, Zustand, React Hook Form, Sonner, Victory, jsPDF, qrcode

## Como rodar

### Back-end

```bash
cd backend
cp .env.example .env    # preencha DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev             # http://localhost:3000  (documentação em /docs)
```

### Front-end

```bash
cd frontend
cp .env.example .env    # VITE_API_URL=http://localhost:3000
npm install
npm run dev             # http://localhost:5173
```

## Configurar a IA

A chamada à IA é feita só pelo back-end (`backend/services/iaService.ts`), no formato chat/completions. Basta preencher no `backend/.env`:

```env
AI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
AI_API_KEY=sua_chave_do_google_ai_studio
AI_MODEL=gemini-3.6-flash
```

1. Crie a chave em https://aistudio.google.com/api-keys (Create API key).
2. Cole em `AI_API_KEY` e reinicie o back-end.
3. Entre como `ana@teste.com`: a tela inicial mostra "Recomendado por IA".

Para usar outro provedor (OpenAI, Groq...), troque o endpoint e a chave. Se o formato for diferente, ajuste as funções `montarRequisicao` e `extrairTexto` em `iaService.ts`.

Se a IA falhar (sem chave, erro ou demora), o back-end recomenda os próximos shows do mesmo gênero sem IA ("Seleção automática") e a tela inicial continua funcionando.

## Usuários de teste

Senha de todos: `senha123`

| Perfil | E-mail | Observação |
|---|---|---|
| Admin | `admin@armazemsonoro.com` | também `admin@teatroaurora.com`, `admin@galpao22.com`, `admin@esquinaazul.com` |
| Cliente | `ana@teste.com` | histórico de Rock |
| Cliente | `bruno@teste.com` | prefere Samba/MPB, mas o histórico é de Sertanejo |
| Cliente | `carla@teste.com` | sem histórico, usa as preferências (Eletrônica) |

## Telas

| Tela | Rota | Acesso |
|---|---|---|
| Início (IA + agenda) | `/` | todos |
| Detalhes do show (comprar ingresso) | `/shows/:id` | todos |
| Entrar / Criar conta | `/entrar`, `/cadastro` | cliente |
| Minha conta (Meus ingressos, Favoritos, Perfil) | `/minha-conta` | cliente |
| Login do admin | `/admin/entrar` | admin |
| Cadastro do local | `/admin/cadastro` | admin |
| Painel do local | `/admin` | admin |
| Dashboard | `/admin/dashboard` | admin |

## Rotas da API

| Rota | Descrição |
|---|---|
| `POST /login/cliente`, `POST /login/admin` | login |
| `POST /clientes` | cadastro do cliente |
| `GET /clientes/perfil`, `PATCH /clientes/preferencias`, `GET /clientes/agenda` | área do cliente |
| `PUT /clientes/interacoes/:showId/:tipo` | compra, favorito, visualizou |
| `DELETE /clientes/interacoes/:showId/favorito` | remove um favorito |
| `POST /admins` | cadastro do admin com local, foto e shows |
| `GET/PUT /admins/local` | dados e foto do local |
| `GET /shows`, `GET /shows/:id` | agenda pública |
| `GET /shows/admin`, `POST /shows`, `PUT/DELETE /shows/:id` | agenda do admin |
| `GET /generos`, `GET /dashboard`, `GET /recomendacoes` | gêneros, dashboard e IA |

## Deploy

O banco fica no Neon. Antes do primeiro deploy, rode na sua máquina (com o `.env` apontando para o Neon):

```bash
cd backend
npx prisma migrate reset   # recria as tabelas e roda o seed
```

### Back-end no Render

New → Web Service → repositório do GitHub:

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Language | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plano | Free |
| Variáveis | `DATABASE_URL`, `JWT_SECRET`, `AI_API_ENDPOINT`, `AI_API_KEY`, `AI_MODEL` |

Teste: `https://SEU-BACK.onrender.com/generos` e `/docs`.

### Front-end na Vercel

Add New → Project → importar o mesmo repositório:

| Campo | Valor |
|---|---|
| Application Preset | Vite |
| Root Directory | `frontend` |
| Environment Variables | `VITE_API_URL` = URL do Render (sem `/` no final) |

As fotos dos locais ficam salvas no banco (tabela `Foto`), então não se perdem quando o Render reinicia.

## Checklist

| Requisito | Onde |
|---|---|
| Login próprio do admin | `frontend/src/admin/AdminLogin.tsx`, `backend/src/routes/login.ts` |
| Cadastro do admin com endereço, foto e agenda | `admin/AdminCadastro.tsx`, `routes/admins.ts` |
| CRUD de shows (data, horário, atração, gênero, valor, descrição) | `admin/AdminPainel.tsx`, `components/FormShow.tsx`, `routes/shows.ts` |
| Validação e upload (tipo e tamanho) | React Hook Form + `validaFoto`, Zod nas rotas, `middlewares/upload.ts` |
| Cadastro do cliente com preferências | `Acesso.tsx`, `routes/clientes.ts` |
| Liga/desliga das preferências | `MinhaConta.tsx`, `PATCH /clientes/preferencias` |
| Compra de ingresso com PDF "Ingresso *nome do evento*" e QR Code PIX | `Detalhes.tsx`, `MinhaConta.tsx`, `utils/ingresso.ts` |
| Agenda de todos os locais com endereço e foto, priorizando preferências | `App.tsx`, `Detalhes.tsx`, `GET /shows` |
| IA na tela inicial, só do gênero mais consumido | `components/Recomendacoes.tsx`, `routes/recomendacoes.ts`, `services/iaService.ts` |
| Fallback sem IA e indicador de carregamento | `routes/recomendacoes.ts`, `Recomendacoes.tsx` |
| Tema escuro com a paleta em variáveis CSS | `frontend/src/index.css` (`:root`) |
| Senha com bcrypt, JWT e rotas por perfil | `routes/login.ts`, `middlewares/verificaToken.ts` |
| Swagger em `/docs` | `backend/swagger.ts`, comentários `#swagger` nas rotas |
| Dashboard com gráficos | `admin/AdminDashboard.tsx`, `routes/dashboard.ts` |
| Seed com dados de teste | `backend/prisma/seed.ts` |

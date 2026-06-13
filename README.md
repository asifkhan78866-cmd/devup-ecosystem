# DevUp Ecosystem

India's startup ecosystem for student founders.

## Architecture

| Service | Tech | Port | Deploy |
|---------|------|------|--------|
| Frontend | Next.js 16 | 3000 | Vercel |
| Backend API | Express + Prisma | 4000 | Railway |
| Admin Portal | Vite + React | 3001 | Railway |
| Database | PostgreSQL | - | Supabase |
| Cache | Redis | 6379 | Upstash |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 9+

### Setup

```bash
git clone https://github.com/your-org/devup-ecosystem
cd devup-ecosystem
npm run setup
```

Fill in your local env files:

- `frontend/.env.local`
- `backend/.env`
- `backend/admin/.env`

### Run database migrations

```bash
npm run db:migrate
npm run db:seed
```

### Start development

```bash
npm run dev
```

Local URLs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Admin Portal: http://localhost:3001
- Prisma Studio: http://localhost:5555 via `npm run db:studio`

## Deployment

Production deploys run through GitHub Actions on merges to `main`.

Manual deploy:

```bash
cd backend && railway up
cd ../frontend && vercel --prod
cd ../backend/admin && railway up
```

## Environment Variables

Examples live in:

- `frontend/.env.local.example`
- `backend/.env.example`
- `backend/admin/.env.example`

Never commit `.env` files. Store production secrets in GitHub Actions and platform environment settings.

## GitHub Actions Secrets

Configure these in GitHub repository settings under Secrets and variables, Actions:

- `RAILWAY_TOKEN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SLACK_WEBHOOK_URL` (optional)

## Production Checks

After deployment:

- Frontend: https://devupecosystem.in
- API health: https://api.devupecosystem.in/health
- Admin: https://admin.devupecosystem.in

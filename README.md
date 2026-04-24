# TylorDev Backend

NestJS + Prisma API for the TylorDev portfolio and admin panel.

## Local development

1. Copy `.env.example` to `.env`.
2. Start PostgreSQL with `npm run db:start` or point `DATABASE_URL` to an existing Postgres instance.
3. Sync the schema with `npm run prisma:push`.
4. Run the API with `npm run start:dev`.

Useful endpoints:

- `GET /health` healthcheck
- `GET /projects` public projects feed
- `GET /articles` public blog feed
- `GET /auth/session` authenticated admin session check

## Railway deployment

This repo includes [railway.toml](C:\Users\Jimbo\Desktop\Portafolio\backend\railway.toml) so Railway can build and run it with:

- Build command: `npm run build`
- Pre-deploy command: `npx prisma db push`
- Start command: `npm run start`
- Healthcheck path: `/health`

Create a Railway PostgreSQL service in the same project and set these environment variables on the backend service:

- `DATABASE_URL`
- `API_PUBLIC_URL`
- `ADMIN_APP_URLS`
- `CORS_ALLOWED_ORIGINS`
- `AUTHORIZED_GITHUB_USERNAME`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `AUTH_SESSION_SECRET`
- `SECURE_COOKIES=true`

Recommended production values:

- `API_PUBLIC_URL=https://<your-backend-domain>`
- `ADMIN_APP_URLS=https://tylordev.github.io/Tylordev-Admin`
- `CORS_ALLOWED_ORIGINS=https://tylordev.github.io`
- `GITHUB_CALLBACK_URL=https://<your-backend-domain>/auth/github/callback`

For this project specifically:

- Public portfolio: `https://tylordev.github.io/Tylordev`
- Admin panel: `https://tylordev.github.io/Tylordev-Admin`

Important:

- `ADMIN_APP_URLS` can include full URLs with paths, and the backend will validate them by origin.
- `CORS_ALLOWED_ORIGINS` should use the browser origin, which for both GitHub Pages sites is just `https://tylordev.github.io`.

Notes:

- Railway provides `PORT` automatically.
- `postinstall` runs `prisma generate`, so the Prisma client is always available in builds.
- The pre-deploy command uses `prisma db push` because this project does not currently track SQL migrations.

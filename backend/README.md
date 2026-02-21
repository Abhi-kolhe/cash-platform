# Cash Platform – Backend

TypeScript/Node.js backend for the Cash Platform project.

## Tech stack

- Node.js (>= 20)
- TypeScript
- Express
- Prisma
- Pino
- Vitest

## Getting started

From this `backend` directory:

```bash
npm install
```

Copy your env file:

```bash
cp .env.example .env   # if you have an example file
# then edit .env with your own values
```

Run database migrations (adjust to your workflow):

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
# or
npx vitest
```

## Security / vulnerabilities

After installing dependencies you may see output like:

```text
4 vulnerabilities (3 high, 1 critical)
To address all issues, run:
  npm audit fix
```

Recommended:

1. Try to auto-fix:
   ```bash
   npm audit fix
   ```
2. If issues remain, review `npm audit` output and decide case‑by‑case
   (sometimes the remaining advisories are in transitive devDependencies only).

## Project structure

- `src/` – application code
- `prisma/` – Prisma schema and migrations
- `node_modules/` – installed dependencies (ignored in git)
- `package.json` / `package-lock.json` – npm metadata/lockfile

## Health & Auth

- Health: `GET /health` -> `{ ok: true, db: "up" }`
- Signup: `POST /auth/signup` with `{ "name": "...", "email": "...", "password": "..." }`
- Login: `POST /auth/login` with `{ "email": "...", "password": "..." }`

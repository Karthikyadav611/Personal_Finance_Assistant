# Personal Finance Assistant (Frontend)

React + Vite frontend for the Personal Finance Assistant app (dashboard, transactions, budgets, charts, and AI assistant UI).

## Live URL

https://personal-finance-assistant-peach.vercel.app/

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query
- Recharts

## Prerequisites

- Node.js 18+ (recommended: Node 20 LTS)
- npm

## Environment Variables

Create a `frontend/.env` file:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

For production, set it to your deployed backend URL, for example:

```bash
VITE_API_BASE_URL=https://personal-finance-assistant-backend.vercel.app
```

Notes:
- `VITE_API_BASE_URL` should NOT end with a trailing `/`.
- If you change `VITE_API_BASE_URL`, you must redeploy the frontend for the change to take effect.

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

Vite will print the local URL (usually `http://localhost:5173`).

## Build

```bash
cd frontend
npm run build
npm run preview
```

## Deploy (Vercel)

Deploy the frontend as a separate Vercel project.

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_BASE_URL` (your backend URL)

## Backend CORS

Make sure the backend allows this frontend origin.

On the backend Vercel project, set:

```bash
FRONTEND_URL=https://personal-finance-assistant-peach.vercel.app
```

## Troubleshooting

- `ERR_CONNECTION_REFUSED` (points to `localhost:5000`):
  - Your frontend is still using the local default. Set `VITE_API_BASE_URL` in Vercel (or `frontend/.env` locally) and redeploy/restart.
- `CORS policy blocked this request`:
  - Update backend `FRONTEND_URL` to include your deployed frontend URL and redeploy backend.

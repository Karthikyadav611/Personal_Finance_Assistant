# Personal Finance Assistant (Multi-Agent AI)

A full-stack Personal Finance Assistant that helps users track transactions and budgets, visualize spending, generate monthly AI reports, forecast spending, and interact through a conversational AI assistant that can take actions from natural language.

This repository is a monorepo with two apps:

- `frontend/` - React + Tailwind UI (dashboard, charts, budgets, transactions, AI chat)
- `backend/` - Node.js + Express + MongoDB API (auth, finance APIs, multi-agent AI orchestration, reports, uploads)

---

## Key Features

- Authentication (JWT + bcrypt)
- Transactions CRUD (income/expense, categories, date, description)
- Budget CRUD with real-time "spent this month" enrichment
- Dashboard analytics with charts (Recharts)
- Conversational AI finance assistant
  - Smart routing to specialized agents (transactions, budgets, insights, forecasting, reports, uploads, market, utility)
  - Utility questions (date/time, calculations)
  - Market-aware responses when a market API key is configured
- Monthly AI reports
  - Totals (income/expense/balance)
  - Top categories and budget alerts
  - AI narrative + suggestions
  - Basic forecasting
- Statement upload (CSV/XLSX/PDF)
  - Extract transactions for preview
  - User confirms import to save to the database

---

## Architecture (Multi-Agent)

```
User
 ↓
React Frontend
 ↓
Express Backend
 ↓
AI Orchestrator
 ↓
Agents
 ├── Transaction Agent
 ├── Budget Agent
 ├── Insight Agent
 ├── Forecast Agent
 ├── Document Agent
 ├── Report Agent
 ├── Market Agent
 └── Utility Agent
 ↓
MongoDB Database
```

---

## Tech Stack

**Frontend**
- React + TypeScript (Vite)
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts
- Framer Motion

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt password hashing
- CORS + centralized error handling

**AI**
- Groq API (OpenAI-compatible chat completions)
- Optional fallback to OpenAI API

**Market Data**
- Alpha Vantage (quotes, movers, news sentiment)

---

## Repository Structure

```
finance-assistant/
  frontend/
  backend/
```

Backend (high level):

```
backend/src/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
    ai/
      agents/
      orchestrator.js
      router.js
      llmClient.js
    finance/
  utils/
  app.js
  server.js
backend/api/index.js  (Vercel entry)
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+ recommended
- MongoDB Atlas cluster (or any MongoDB connection string)

### 1) Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (you can copy from `.env.example`) and fill values:

- `MONGODB_URI` (or `MONGO_URI`)
- `JWT_SECRET`
- `FRONTEND_URL`
- Optional: `GROQ_API_KEY` and `ALPHA_VANTAGE_API_KEY`

Start backend:

```bash
npm run dev
# or
npm start
```

Backend runs on `http://localhost:5000` by default.

### 2) Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (copy from `frontend/.env.example`) and set:

- `VITE_API_BASE_URL=http://localhost:5000`

Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:8080` (as configured in `vite.config.ts`).

---

## Environment Variables

### Backend (`backend/.env`)

- `NODE_ENV` - `development` / `production`
- `PORT` - default `5000`
- `MONGODB_URI` - MongoDB connection string (preferred)
- `MONGO_URI` - optional fallback key for MongoDB connection string
- `JWT_SECRET` - strong secret for signing tokens
- `JWT_EXPIRES_IN` - default `7d`
- `FRONTEND_URL` - comma-separated allowed origins for CORS
- `GROQ_API_KEY` - optional, enables richer AI replies
- `GROQ_MODEL` - optional (default set in `.env.example`)
- `OPENAI_API_KEY` - optional alternative to Groq
- `OPENAI_MODEL` - optional
- `ALPHA_VANTAGE_API_KEY` - optional, enables live market quotes/news/movers
- `ALPHA_VANTAGE_ENTITLEMENT` - optional (`free`, `delayed`, `realtime` depending on your plan)

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL` - backend base URL (local or deployed)

---

## API Endpoints (Backend)

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

Compatibility routes for the current frontend are also available:
- `POST /auth/register`
- `POST /auth/login`

### User

- `GET /api/user/profile`

### Transactions

- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

Compatibility routes:
- `GET /transactions`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`

### Budgets

- `GET /api/budget`
- `POST /api/budget`
- `PUT /api/budget/:id`
- `DELETE /api/budget/:id`

Compatibility routes:
- `GET /budget`
- `POST /budget`
- `PUT /budget/:id`
- `DELETE /budget/:id`

### AI Chat

- `POST /api/ai/chat`
- `POST /api/chatbot`

Compatibility route:
- `POST /chatbot`

### Reports

- `POST /api/reports/generate`
- `GET /api/reports/:month/:year`

### Uploads

- `POST /api/uploads/statement` (multipart form-data: `file`)
- `POST /api/uploads/import-confirmed`

### Forecast

- `GET /api/analytics/forecast`

---

## Deploying on Vercel (Frontend + Backend)

This repo can be deployed as two separate Vercel projects:

1. **Backend project**
   - Import this Git repository into Vercel
   - Set **Root Directory** to `backend`
   - Add Environment Variables (MongoDB URI, JWT secret, CORS origin, AI keys)
   - Deploy

2. **Frontend project**
   - Import the same Git repository into Vercel again
   - Set **Root Directory** to `frontend`
   - Set `VITE_API_BASE_URL` to the backend production URL
   - Deploy

Tip: Use the stable **production** URL (or a custom domain) for `VITE_API_BASE_URL` so it doesn't change between deployments.

---

## Screenshots

Add screenshots/gifs here (recommended for portfolio/resume):

- Dashboard overview
- AI assistant chat + action execution
- Monthly report screen
- Upload preview + import flow

---

## Future Scope

- Category auto-suggestion using LLM classification
- Duplicate transaction detection improvements (fuzzy match + merchant extraction)
- More forecasting signals (seasonality, anomaly detection, category forecasts)
- Receipt OCR (Tesseract) for images
- Export reports (PDF) and share links
- Role-based rate limiting and audit logs

---

## Resume Description

Built a production-style Personal Finance Assistant with a multi-agent AI orchestration layer. The assistant routes user queries to specialized agents to manage transactions and budgets via natural language, generate monthly AI reports with forecasts and budget alerts, and import statements from CSV/XLSX/PDF. Implemented a secure Express/MongoDB backend with JWT auth and a modern React dashboard with real-time charts and insights.


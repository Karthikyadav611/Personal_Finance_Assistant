# 💰 Personal Finance Assistant (Full-Stack)

A full-stack Personal Finance Assistant web application built with a **React (Vite) frontend** and a **Node.js (Express) + MongoDB backend**.

It supports:
- 🔐 Authentication (JWT)
- 💸 Transaction & Budget Management
- 📊 Finance Analytics & Summaries
- 🤖 AI-powered Assistant (Natural Language Finance Operations)

---

## 🚀 Live App

Frontend: https://personal-finance-assistant-peach.vercel.app/

> Update URLs if you deploy your own version.

---

## 🛠️ Tech Stack

### Frontend
- React + TypeScript (Vite)
- Tailwind CSS + shadcn/ui
- TanStack Query
- Recharts

### Backend
- Node.js + Express
- MongoDB Atlas + Mongoose
- JWT Authentication
- bcrypt Password Hashing
- CORS + Error Handling

### AI Integration
- Groq API (LLM-based assistant)
- Optional Market Data APIs (Alpha Vantage)

---

## 📁 Project Structure

```
finance-assistant/
│
├── backend/        # Express API (MongoDB, JWT, AI assistant)
│
├── frontend/       # React (Vite) frontend UI
```

---

## ⚙️ Prerequisites

- Node.js (18+ recommended)
- npm
- MongoDB Atlas (or any MongoDB instance)

---

## 🧑‍💻 Quick Start (Local Development)

### 1️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file inside `backend/`:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:5173,https://your-frontend.vercel.app

# AI (Optional)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Market Data (Optional)
ALPHA_VANTAGE_API_KEY=your_key
ALPHA_VANTAGE_ENTITLEMENT=free
```

Run backend:

```bash
npm run dev
```

Backend runs on:
```
http://localhost:5000
```

---

### 2️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env` file inside `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

**Required:**
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`

**Optional:**
- `PORT`
- `JWT_EXPIRES_IN`
- `GROQ_API_KEY`
- `ALPHA_VANTAGE_API_KEY`

---

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL` → Backend URL

⚠️ Notes:
- Do NOT add trailing `/`
- Rebuild required after env changes

---

## 🔌 API Overview

### 🔐 Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`

---

### 👤 User
- `GET /api/user/profile` (Protected)

---

### 💸 Transactions
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

Filters:
- `type=income|expense`
- `startDate`
- `endDate`

---

### 📊 Budgets
- `GET /api/budget`
- `POST /api/budget`
- `PUT /api/budget/:id`
- `DELETE /api/budget/:id`

---

### 🤖 AI Assistant
- `POST /api/chatbot`

Capabilities:
- Natural language transaction handling
- Budget management
- Financial summaries
- Market insights

---

## 📦 Example API Requests

### Register

```json
POST /api/auth/register
{
  "name": "Alex",
  "email": "alex@example.com",
  "password": "StrongPass123"
}
```

---

### Login

```json
POST /api/auth/login
{
  "email": "alex@example.com",
  "password": "StrongPass123"
}
```

---

### Authenticated Request

```
GET /api/transactions
Authorization: Bearer <JWT_TOKEN>
```

---

## 🚀 Deployment (Vercel)

### Backend Deployment

1. Create Vercel Project
2. Set Root Directory → `backend`
3. Add Environment Variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`

Backend URL:
```
https://your-backend.vercel.app
```

---

### Frontend Deployment

1. Create Vercel Project
2. Set Root Directory → `frontend`
3. Add:
   ```env
   VITE_API_BASE_URL=https://your-backend.vercel.app
   ```

---

## 🔒 Security Notes

- ❌ Never commit `.env`
- 🔐 Use strong `JWT_SECRET`
- 🔑 Store API keys securely
- 🌐 Configure MongoDB IP whitelist

---

## 📜 Scripts

### Backend

```bash
npm run dev    # Development (nodemon)
npm start      # Production
```

### Frontend

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run preview  # Preview build
```

---

## 📄 License

MIT License (Update if needed)

---

## 👨‍💻 Author

**Karthik Yadav**

- Full Stack Developer
- AI & Deep Learning Enthusiast

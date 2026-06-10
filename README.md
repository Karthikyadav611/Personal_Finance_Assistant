# 💰 Personal Finance Assistant V2 (Multi-Agent AI)

A production-style Personal Finance Assistant that helps users manage transactions and budgets, visualize spending, generate AI-powered monthly reports, forecast future expenses, upload bank statements, and interact with a conversational AI assistant capable of performing finance operations through natural language.

## 🚀 Live Application

Frontend: https://personal-finance-assistant-peach.vercel.app/

---

## 🌟 Key Features

### Authentication

* JWT Authentication
* Secure password hashing using bcrypt
* Protected routes and user-specific data

### Transaction Management

* Create, update, delete transactions
* Income and expense tracking
* Category-based organization
* Date filtering and analytics

### Budget Management

* Monthly category budgets
* Real-time spending progress
* Overspending alerts
* Budget performance insights

### Dashboard Analytics

* Income vs Expense visualization
* Spending category breakdown
* Financial summaries
* Interactive charts using Recharts

### Multi-Agent AI Assistant

* Conversational finance assistant
* Natural language transaction creation
* Budget management through chat
* Financial insights and recommendations
* Utility calculations and finance queries
* Market-aware responses (optional)

### AI Reports & Forecasting

* Monthly financial reports
* Spending trend analysis
* Forecasted future expenses
* Personalized savings suggestions
* Budget utilization summaries

### Statement Upload & Import

* CSV upload support
* XLSX upload support
* PDF statement parsing
* Transaction preview before import
* Bulk transaction import

---

## 🏗️ System Architecture

```text
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
 ├── Report Agent
 ├── Upload Agent
 ├── Market Agent
 └── Utility Agent
 ↓
MongoDB Database
```

---

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* ShadCN UI
* Radix UI
* Recharts
* Framer Motion

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* bcrypt
* CORS
* Centralized Error Handling

### AI

* Groq API
* OpenAI Compatible APIs
* Multi-Agent Routing Architecture

### Market Data

* Alpha Vantage API

---

## 📁 Repository Structure

```text
finance-assistant/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── agents/
│   │   │   │   ├── orchestrator.js
│   │   │   │   └── router.js
│   │   │   └── finance/
│   │   └── utils/
│   │
│   ├── app.js
│   ├── server.js
│   └── api/index.js
│
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites

* Node.js 18+
* MongoDB Atlas
* npm

---

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8080

GROQ_API_KEY=your_groq_api_key

ALPHA_VANTAGE_API_KEY=your_api_key
```

Start backend:

```bash
npm run dev
```

---

### Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

---

## 🔌 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

### User

```http
GET /api/user/profile
```

### Transactions

```http
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

### Budgets

```http
GET    /api/budget
POST   /api/budget
PUT    /api/budget/:id
DELETE /api/budget/:id
```

### AI Assistant

```http
POST /api/chatbot
POST /api/ai/chat
```

### Reports

```http
POST /api/reports/generate
GET  /api/reports/:month/:year
```

### Uploads

```http
POST /api/uploads/statement
POST /api/uploads/import-confirmed
```

### Forecasting

```http
GET /api/analytics/forecast
```

---

## 🚀 Deployment

### Backend Deployment

* Create Vercel Project
* Set Root Directory to `backend`
* Configure environment variables
* Deploy

### Frontend Deployment

* Create another Vercel Project
* Set Root Directory to `frontend`
* Set:

```env
VITE_API_BASE_URL=https://your-backend-url.vercel.app
```

* Deploy

---

## 📸 Screenshots

Recommended screenshots:

* Dashboard Overview
* AI Chat Assistant
* Budget Tracking
* Expense Analytics
* Monthly Reports
* Statement Upload Flow

---

## 🔒 Security

* Never commit `.env`
* Use strong JWT secrets
* Secure MongoDB access
* Validate all API inputs
* Configure CORS properly

---

## 📜 Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

---

## 🔮 Future Enhancements

* OCR Receipt Scanning
* Category Auto Classification
* Advanced Forecasting Models
* Export Reports as PDF
* Email Financial Reports
* Multi-Currency Support
* Investment Tracking

---

## 👨‍💻 Author

**Karthik Yadav M**

* Full Stack Developer
* AI & Machine Learning Enthusiast
* React • Node.js • MongoDB • Generative AI

---

### Resume Project Description

Built a production-style Personal Finance Assistant with a multi-agent AI architecture that enables users to manage transactions and budgets through natural language, generate AI-powered financial reports, forecast future spending, and import statements from CSV/XLSX/PDF files. Developed using React, Node.js, Express, MongoDB, JWT authentication, and AI integrations with Groq.

# Finance Assistant Backend

Production-ready Node.js, Express, MongoDB, and JWT backend for the existing React frontend in this repository.

## Features

- User registration and login
- JWT authentication with protected routes
- bcrypt password hashing
- MongoDB Atlas integration with Mongoose
- Transactions CRUD with filters and summary totals
- Budgets CRUD with spent-per-category calculation
- CORS, dotenv, error handling, and compatibility routes for the current frontend

## Folder Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/
    app.js
    server.js
  .env.example
  package.json
```

## Setup

1. Copy `.env.example` to `.env`
2. Fill in your MongoDB Atlas connection string and JWT secret
3. Install dependencies:

```bash
npm install
```

4. Run the server:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default, which already matches the current frontend fetch calls.

## Main API Routes

### Requested API contract

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `GET /api/transactions`
- `POST /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/budget`
- `POST /api/budget`
- `PUT /api/budget/:id`
- `DELETE /api/budget/:id`

### Compatibility routes for the current frontend

- `POST /auth/register`
- `POST /auth/login`
- `GET /user/profile`
- `GET /transactions`
- `POST /transactions`
- `PUT /transactions/:id`
- `DELETE /transactions/:id`
- `POST /chatbot`

## Example Request

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Aman Kumar",
  "email": "aman@example.com",
  "password": "StrongPass123"
}
```

### Login response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6627d59ba0d8f422bc13c522",
      "name": "Aman Kumar",
      "email": "aman@example.com",
      "createdAt": "2026-04-23T10:00:00.000Z"
    },
    "token": "jwt-token-here"
  },
  "token": "jwt-token-here"
}
```

### Create transaction

```http
POST /api/transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "expense",
  "amount": 1200,
  "category": "Food & Dining",
  "description": "Dinner with friends",
  "date": "2026-04-23"
}
```

### Transactions response

```json
{
  "success": true,
  "message": "Transactions fetched successfully",
  "data": {
    "transactions": [
      {
        "_id": "6627d7c9a0d8f422bc13c550",
        "userId": "6627d59ba0d8f422bc13c522",
        "amount": 1200,
        "type": "expense",
        "category": "Food & Dining",
        "date": "2026-04-23T00:00:00.000Z",
        "description": "Dinner with friends",
        "note": "Dinner with friends"
      }
    ],
    "summary": {
      "totalIncome": 0,
      "totalExpense": 1200,
      "balance": -1200
    },
    "filters": {
      "type": null,
      "startDate": null,
      "endDate": null
    }
  }
}
```

## Frontend Integration

The current frontend already points auth, transactions, and chatbot calls to `http://127.0.0.1:5000` or `http://localhost:5000`, so you can run this backend without changing those components.

If you later want to standardize the frontend to the requested `/api/...` contract:

- Change login/register to use `/api/auth/login` and `/api/auth/register`
- Change transactions to use `/api/transactions`
- For `GET /api/transactions`, read `data.transactions` instead of assuming a raw array

## Notes

- The transaction model stores `description` and also returns `note` for frontend compatibility.
- The budget API accepts both `limit` and `allocated` on create/update.
- The chatbot endpoint is a lightweight compatibility endpoint because your current frontend already calls `/chatbot`.

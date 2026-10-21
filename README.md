# Payment & Billing Assistant (Zoho Zia)

An AI-powered payment and billing support assistant built with React, Tailwind CSS, Node.js/Express, and Zoho Zia Agents API.

## Project Structure

```
├── backend/            # Express server (Zoho OAuth proxy & Zia Agent integration)
│   ├── api/index.js    # Vercel serverless entry point
│   ├── src/            # Backend routes, services, middleware
│   ├── .env.example    # Environment variable template
│   └── vercel.json     # Vercel deployment configuration
├── frontend/           # Vite + React + Tailwind CSS client
│   ├── src/            # UI components, chat widget, hooks
│   └── vercel.json     # SPA routing configuration
└── README.md
```

## Setup & Running Locally

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your Zoho OAuth credentials in .env
npm start
```
The backend starts on `http://localhost:4000`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend starts on `http://localhost:5173`.

## Deployment on Vercel

1. Push this repository to GitHub.
2. In Vercel, import the repo twice:
   - **Backend**: Set Root Directory to `backend`, add your `.env` variables.
   - **Frontend**: Set Root Directory to `frontend`, add `VITE_API_URL` pointing to your backend URL.

# CineBook - Real-Time Movie Ticket Booking System

CineBook is a production-quality, real-time movie ticket booking full-stack web application designed for high concurrency and immediate seat locking visual synchronization across clients.

## Key Features

- **User Authentication**: Secure Registration, Login, JWT auth, and role-based authorization (`USER` / `ADMIN`).
- **Movie Catalog & Showtime Discovery**: Search, filter by genre, check ratings, duration, minimum age restrictions, and browse scheduled showtimes across screens.
- **Real-Time Seat Locking & Booking**: Socket.io bi-directional seat locking with automatic 5-minute countdown expiry timers and double-booking race-condition prevention.
- **Government ID Proof Validation**: Support and strict validation for Aadhar (12 digits), PAN (`ABCDE1234F`), Driving License, and Passport format.
- **Age Restriction Policy Enforcement**: Automatic age verification comparing user account age against movie minimum age limits (`U`, `UA 13+`, `A 18+`).
- **PDF E-Ticket Generation**: Instant high-resolution downloadable PDF ticket generator powered by PDFKit.
- **My Bookings & Cancellation**: Customer booking portal with active/cancelled views and ticket release broadcasting.
- **Master Admin Dashboard**: Admin portal with live operational metrics, revenue calculations, Movie CRUD, Show scheduling, User management, and Booking oversight.

## Technology Stack

- **Frontend**: React.js, Vite, React Router, Context API, `graphql-request`, `socket.io-client`, Lucide React icons, React Toastify, Tailwind CSS.
- **Backend**: Node.js, Express.js, GraphQL (`graphql-http`), Sequelize ORM, MySQL, Socket.io, JWT, bcryptjs, PDFKit.
- **Database**: MySQL (`cinebook_db`).

## Setup & Running Instructions on Windows

### 1. Prerequisites
- Node.js (v18+) and npm installed.
- MySQL Server 8.0 running on localhost (Port 3307 or 3306).

### 2. Database Initialization
Create database in MySQL:
```sql
CREATE DATABASE cinebook_db;
```

### 3. Backend Setup & Seeding
```powershell
cd backend
npm install
npm run seed
npm start
```
The backend API server will run at `http://localhost:5000` with GraphQL endpoint at `http://localhost:5000/graphql`.

### 4. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
The frontend Vite dev server will run at `http://localhost:5173`.

## Stripe Integration & Test Mode Workflow

FLYXO / CineBook uses Stripe Checkout for secure server-verified ticket payments.

### 1. Environment Variables Configuration
In `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_51... (Your Stripe Secret Key)
STRIPE_WEBHOOK_SECRET=whsec_... (Your Stripe Webhook Secret)
FRONTEND_URL=http://localhost:5173
```

### 2. Stripe Test Mode & Test Cards
When testing payments in development:
- Use **Stripe TEST MODE**.
- Standard Test Card Number: `4242 4242 4242 4242`
- Expiration Date: Any future date (e.g. `12/30`)
- CVC: Any 3 digits (e.g. `123`)
- ZIP/Postal Code: Any valid code (e.g. `90210` or `110001`)

### 3. Local Webhook Testing with Stripe CLI
To test Stripe Webhook events (`checkout.session.completed`, `checkout.session.expired`) on your local machine:
1. Download and install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Authenticate Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhook events to your local backend server:
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
4. Copy the webhook signing secret printed in your terminal (e.g., `whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in `backend/.env`.

## Default Account Credentials

- **Admin Account**:
  - Email: `admin@cinebook.com`
  - Password: `admin123`
- **Customer Account (Adult 22 yrs)**:
  - Email: `user@cinebook.com`
  - Password: `user123`
- **Minor Customer Account (15 yrs)**:
  - Email: `minor@cinebook.com`
  - Password: `user123`


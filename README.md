# Food Delivery Platform

A full-stack food delivery web application with a customer storefront, admin management panel, and REST API backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| **Customer Frontend** | React 19, React Router 7, Axios, Vite |
| **Admin Panel** | React 19, React Router 7, Zustand, Recharts, Vite |
| **Auth** | JWT (python-jose), bcrypt (passlib) |
| **Real-time** | WebSocket support |

## Project Structure

```
Food Delivery Project/
├── backend/                  # FastAPI REST API
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── config.py         # Pydantic settings
│   │   ├── database.py       # SQLAlchemy engine
│   │   ├── models/           # ORM models (user, food, order, payment, etc.)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Error handlers
│   │   └── utils/            # Security, dependencies, exceptions
│   ├── alembic/              # Database migrations
│   ├── seed.py               # Database seeder
│   └── requirements.txt
├── frontend/                 # Customer React app (port 3000)
│   └── src/
│       ├── api/              # Axios client + API modules
│       ├── context/          # AuthContext, StoreContext
│       ├── components/       # Navbar, Footer, FoodDisplay, etc.
│       └── pages/            # Home, Cart, PlaceOrder, MyOrders
└── admin/                    # Admin React app (port 5174)
    └── src/
        ├── api/              # Full CRUD API modules
        ├── store/            # Zustand auth store
        ├── hooks/            # usePagination
        ├── components/       # Layout, Sidebar, common UI
        └── pages/            # Dashboard, Orders, Foods, Categories, Users, etc.
```

## Prerequisites

- **Python 3.10+** with pip
- **Node.js** (LTS) with npm
- **PostgreSQL** running on port 5432

## Getting Started

### 1. Clone and configure environment

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your PostgreSQL credentials and a strong `SECRET_KEY` (min 32 characters for production).

### 2. Install dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend & Admin
cd ../frontend && npm install
cd ../admin && npm install

# Or from root (installs all):
npm run install:all
```

### 3. Set up the database

```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE food_delivery;"

# Run migrations
cd backend
alembic upgrade head

# Seed sample data (admin user + 8 categories + 32 food items)
python seed.py
```

### 4. Run the application

```bash
# From root — starts all 3 services concurrently
npm run dev
```

This runs:

| Service | URL |
|---------|-----|
| Customer Frontend | http://localhost:3000 |
| Admin Panel | http://localhost:5174 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

### Default Admin Credentials

- **Email:** `admin@fooddelivery.com`
- **Password:** `admin123`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | `development`, `staging`, or `production` |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/food_delivery` | PostgreSQL connection string |
| `SECRET_KEY` | `dev-only-change-me` | JWT signing key |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime |
| `UPLOAD_DIR` | `uploads` | Image upload directory |
| `CORS_ORIGINS` | `["http://localhost:3000",...]` | Allowed CORS origins |

> **Production safety:** When `APP_ENV` is `production` or `staging`, the app enforces a strong `SECRET_KEY` (32+ chars) and rejects localhost database URLs.

## Features

### Customer

- Browse menu with category filtering and search
- Add/remove items from cart
- Apply promo codes for discounts
- Checkout with delivery address, phone, and payment method selection
- View order history and status
- Register and login

### Admin

- **Dashboard** — Total orders, revenue, users, 30-day sales chart, order status distribution, top-selling items, recent orders
- **Order Management** — Full lifecycle with state machine: `placed → confirmed → preparing → ready → out_for_delivery → delivered` (with cancellation at any active step)
- **Food Management** — CRUD with image upload, availability toggle, featured flag
- **Category Management** — CRUD with sort order
- **User Management** — View, edit, deactivate users by role
- **Payment Management** — View payments, process refunds
- **Promo Code Management** — Percent or fixed discounts, min order amounts, usage limits, expiry dates
- **Notifications** — Send targeted or broadcast notifications
- **Settings** — Configure delivery fee, tax rate, min order amount

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register customer account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |

### Foods

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/foods` | No | List foods (paginated, filterable) |
| GET | `/api/foods/{id}` | No | Get food item |
| POST | `/api/foods` | Admin | Create food item |
| PUT | `/api/foods/{id}` | Admin | Update food item |
| DELETE | `/api/foods/{id}` | Admin | Soft-delete (sets `is_available=False`) |

### Categories

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | No | List categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/{id}` | Admin | Update category |
| DELETE | `/api/categories/{id}` | Admin | Soft-delete |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/orders` | Yes | List orders (admin sees all; customers see own) |
| GET | `/api/orders/{id}` | Yes | Get order details |
| POST | `/api/orders` | Yes | Create order |
| PATCH | `/api/orders/{id}` | Admin | Update status / assign delivery agent |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/{id}` | Admin | Get user |
| PUT | `/api/users/{id}` | Admin | Update user |
| DELETE | `/api/users/{id}` | Admin | Deactivate user |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/payments` | Admin | List payments |
| POST | `/api/payments` | Admin | Create payment |
| PATCH | `/api/payments/{id}` | Admin | Update status / process refund |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/dashboard` | Admin | Full dashboard data |

### Upload

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload/image` | Admin | Upload image (JPEG/PNG/WebP/GIF, max 5MB, converted to WebP) |

### Promo Codes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/promos` | Admin | List promos |
| POST | `/api/promos` | Admin | Create promo |
| PUT | `/api/promos/{id}` | Admin | Update promo |
| DELETE | `/api/promos/{id}` | Admin | Delete promo |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| GET | `/api/notifications/unread-count` | Yes | Unread count |
| PATCH | `/api/notifications/{id}/read` | Yes | Mark as read |
| POST | `/api/notifications` | Admin | Send notification |

### Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Admin | List settings |
| PUT | `/api/settings/{key}` | Admin | Create/update setting |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Readiness check (tests DB) |
| GET | `/api/health/live` | Liveness check |
| GET | `/api/health/ready` | Readiness check |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `ws://localhost:8000/ws?token=<JWT>` | Real-time broadcast messaging |

## Architecture Notes

- **Soft deletes** — Foods, categories, and users are deactivated rather than hard-deleted to preserve order history integrity
- **Order state machine** — Enforces valid status transitions, preventing invalid state changes
- **Image processing** — All uploads are converted to WebP format at 85% quality for smaller file sizes
- **Decimal arithmetic** — All monetary calculations use Python `Decimal` to avoid floating-point errors
- **Composite indexes** — `(user_id, created_at)` and `(status, created_at)` for efficient order queries

## Production Deployment Notes

- Change `SECRET_KEY` and database credentials from defaults
- Use a reverse proxy (nginx/Caddy) for HTTPS termination
- Build React apps with `npm run build` and serve as static files
- Replace local file uploads with S3-compatible object storage
- For horizontal scaling, use Redis pub/sub for WebSocket broadcast
- Provision a managed PostgreSQL instance (AWS RDS, Supabase, Railway, etc.)

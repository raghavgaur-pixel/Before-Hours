# AFTERHOURS - Backend Service

Fastify backend for **AFTERHOURS**, providing player authentication, database persistence via Prisma & Supabase PostgreSQL, and game state management.

---

## Tech Stack

- **Runtime:** Node.js (v20+)
- **Framework:** Fastify v5 (TypeScript)
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma v6
- **Auth:** JWT (`@fastify/jwt`), HTTP-only cookies (`@fastify/cookie`), and bcrypt password hashing
- **Client SDK:** Supabase JS (`@supabase/supabase-js`)
- **Validation:** Zod
- **Testing:** Vitest

---

## API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account and initialize starter character & settlement | No |
| `POST` | `/api/auth/login` | Login with email or username + password | No |
| `POST` | `/api/auth/logout` | Clear session cookie | No |
| `GET` | `/api/auth/me` | Fetch authenticated player profile, character stats, and settlement | Yes (`Bearer <token>` or cookie) |

### System

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint |

---

## Registration Payload Example

```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "warrior@afterhours.game",
  "username": "shadowblade",
  "password": "Password123!",
  "archetype": "warrior"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful. Welcome to AFTERHOURS.",
  "user": {
    "id": "c1387d7b-99d6-444a-9721-36ba9a205a0d",
    "email": "warrior@afterhours.game",
    "username": "shadowblade",
    "createdAt": "2026-10-30T12:00:00.000Z",
    "character": {
      "name": "shadowblade",
      "archetype": "warrior",
      "level": 1,
      "health": 100,
      "maxHealth": 100,
      "strength": 14,
      "agility": 10,
      "magic": 5,
      "endurance": 10
    },
    "settlement": {
      "name": "shadowblade's Stronghold",
      "wood": 100,
      "stone": 100,
      "food": 100,
      "iron": 50
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5c..."
}
```

---

## Login Payload Example

```json
POST /api/auth/login
Content-Type: application/json

{
  "login": "shadowblade",
  "password": "Password123!"
}
```

---

## Setup & Running

1. **Install dependencies:**
   ```bash
   npm --prefix backend/server install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` in `backend/server/` and fill in your Supabase database credentials:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.[YOUR-PROJECT]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
   ```

3. **Prisma commands:**
   - Push schema to Supabase:
     ```bash
     npm --prefix backend/server run prisma:push
     ```
   - Generate Prisma Client:
     ```bash
     npm --prefix backend/server run prisma:generate
     ```

4. **Start Development Server:**
   ```bash
   npm --prefix backend/server run dev
   ```

5. **Run Tests:**
   ```bash
   npm --prefix backend/server run test
   ```

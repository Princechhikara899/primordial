# Primordial — StreakSquad

A clean, modular, college-level full-stack goal accountability web application. Users can create or join challenges with peers, track daily progress, maintain consistency streaks, use streak freezes, and climb leaderboards.

---

## What is Primordial?

People often struggle to stay consistent with personal goals because they lack accountability and structure. Primordial solves this with:

- **Goal Challenges** — Create custom challenges (e.g., 30 Days of Web Development, 21 Days of Morning Fitness).
- **Public & Private Squads** — Join open squads or participate in invite-only private challenges via unique 8-character codes.
- **Daily Check-ins** — Submit verified daily progress with optional notes (prevented from duplicate daily submissions).
- **Consecutive Streaks** — Track active streaks and personal longest streaks with our calendar-day calculation engine.
- **Streak Freeze** — Use a freeze to protect your streak when an unavoidable day is missed.
- **Squad Leaderboard** — Real-time rankings computed directly in PostgreSQL using window functions (`DENSE_RANK()`).
- **User Dashboard** — Overview of active challenges, goal completion percentages, and available streak freezes.
- **Squad Chat** — Dedicated group chat per challenge backed by MongoDB.

---

## Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | Single-page application, clean responsive UI |
| Backend | Node.js + Express.js | REST APIs, MVC architecture, custom middlewares |
| Relational DB | PostgreSQL + Prisma ORM | Users, Challenges, Memberships, Check-ins, Streak Freezes |
| Document DB | MongoDB (Mongoose) | Real-time squad group messages |
| Authentication | `express-session` + `bcryptjs` | Secure session cookies (HTTP-only), password hashing |

---

## Features (Clean 10-Feature Scope)

1. **User Authentication** — Registration, login, session persistence, and logout with bcrypt password hashing and HTTP-only session cookies.
2. **Create & Manage Challenges** — Full CRUD operations; only challenge creators can update or delete challenges.
3. **Public & Private Challenges** — Public challenges are open to everyone; private challenges generate a secure 8-character invite code.
4. **Join & Leave Challenges** — Join challenges with duplicate membership prevention; leave challenges cleanly.
5. **Daily Check-ins** — Log daily check-ins with optional notes. Enforced by PostgreSQL composite unique constraint `@@unique([userId, challengeId, date])`.
6. **Streak Tracking Engine** — Computes current active streak and longest streak across calendar days.
7. **Streak Freeze** — Limited inventory of streak freezes per user to protect one missed day from breaking a streak.
8. **Squad Leaderboard** — Ranks participants based on verified check-in count using PostgreSQL `DENSE_RANK()` and `COUNT()`.
9. **User Dashboard** — Clean summary cards, active squads, progress bars, and one-click check-ins.
10. **Squad Group Chat** — Challenge-specific group messaging stored in a dedicated MongoDB collection.

---

## Project Structure

```
capstonerrrr/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL schema definition
│   │   └── seed.js                # Repeatable database seed script
│   └── src/
│       ├── app.js                 # Express application & CORS configuration
│       ├── server.js              # Server entry point & port handling
│       ├── config/
│       │   ├── prisma.js          # Prisma client instance
│       │   ├── mongodb.js         # MongoDB connection handler
│       │   └── session.js         # Session cookie configuration
│       ├── controllers/
│       │   ├── authController.js        # Registration, login, logout, getMe
│       │   ├── challengeController.js   # Challenge CRUD & listings
│       │   ├── membershipController.js  # Join, leave, member rosters
│       │   ├── checkinController.js     # Daily check-ins & streak freezes
│       │   ├── leaderboardController.js # PostgreSQL SQL window function rankings
│       │   ├── dashboardController.js   # User stats & history
│       │   └── chatController.js        # MongoDB group chat
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── challengeRoutes.js
│       │   ├── userRoutes.js
│       │   └── chatRoutes.js
│       ├── middleware/
│       │   ├── authMiddleware.js        # requireAuth session validator
│       │   ├── validationMiddleware.js  # Input payload validation
│       │   └── errorMiddleware.js       # Centralized error handler
│       ├── services/
│       │   └── streakService.js         # Streak & freeze calendar calculations
│       └── models/
│           └── messageModel.js          # Mongoose schema for squad chat
├── frontend/
│   └── src/
│       ├── components/            # Navbar, Footer
│       ├── context/               # AuthContext (session state)
│       ├── pages/                 # Clean, responsive view components
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── ExploreChallengesPage.jsx
│       │   ├── JoinedChallengesPage.jsx
│       │   ├── CreateChallengePage.jsx
│       │   ├── ChallengeDetailsPage.jsx
│       │   ├── LeaderboardPage.jsx
│       │   ├── GroupChatPage.jsx
│       │   ├── CheckInHistoryPage.jsx
│       │   └── ProfilePage.jsx
│       └── services/
│           └── api.js             # Centralized fetch client
└── docs/                          # API documentation & viva preparation
```

---

## Database Schemas

### PostgreSQL (Prisma ORM)
- **`users`** — `id`, `name`, `email`, `password`, `streakFreezes`, `createdAt`
- **`challenges`** — `id`, `title`, `description`, `duration`, `visibility`, `inviteCode`, `creatorId`, `createdAt`
- **`memberships`** — `id`, `userId`, `challengeId`, `joinedAt` · `@@unique([userId, challengeId])`
- **`checkins`** — `id`, `userId`, `challengeId`, `date`, `note`, `createdAt` · `@@unique([userId, challengeId, date])`
- **`streak_freezes`** — `id`, `userId`, `challengeId`, `date`, `usedAt` · `@@unique([userId, challengeId, date])`

### MongoDB (Mongoose)
- **`messages`** — `challengeId`, `senderId`, `senderName`, `message`, `createdAt`

---

## Running Locally

### Prerequisites
- Node.js v18+
- PostgreSQL running on port 5432
- MongoDB running on port 27017

### 1. Backend Setup

```bash
cd backend
npm install

# Verify environment variables in .env (or copy from .env.example)
# DATABASE_URL="postgresql://username:password@localhost:5432/primordial"
# MONGODB_URI="mongodb://localhost:27017/primordial_chat"
# SESSION_SECRET="primordial_session_secret"
# PORT=5001

# Apply database migrations
npx prisma migrate dev

# Seed demo accounts and realistic challenges
npm run seed

# Start backend server
npm run dev
```

Backend will start at: `http://localhost:5001` (API Base: `http://localhost:5001/api`)

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```

Frontend will open at: `http://localhost:5173` (proxies `/api` to `http://localhost:5001`)

---

## Demo Accounts

All demo accounts use password: **`password123`**

| Persona | Email | State & Highlights |
|---|---|---|
| **Alex Carter** | `alex@example.com` | 5-day active streak, #1 on Fitness leaderboard |
| **Sarah Jenkins** | `sarah@example.com` | Missed Day 2, protected by Streak Freeze |
| **David Chen** | `david@example.com` | Coding challenge creator, 3-day longest streak |
| **Elena Rostova** | `elena@example.com` | Reading challenge creator, 1-day active streak |
| **Marcus Vance** | `marcus@example.com` | Early rising challenge creator |

Private Challenge Invite Code: **`STUDY2026`**

---

## API Reference

Base URL: `http://localhost:5001/api`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Sign in & establish session cookie |
| `POST` | `/auth/logout` | Destroy session & clear cookie |
| `GET` | `/auth/me` | Get currently authenticated user |
| `GET` | `/challenges` | List public challenges |
| `POST` | `/challenges` | Create a new challenge |
| `GET` | `/challenges/:id` | View challenge details |
| `PUT` | `/challenges/:id` | Update challenge (creator only) |
| `DELETE` | `/challenges/:id` | Delete challenge (creator only) |
| `POST` | `/challenges/:id/join` | Join a public challenge |
| `POST` | `/challenges/:id/leave` | Leave a challenge |
| `POST` | `/challenges/join-private` | Join private challenge via invite code |
| `POST` | `/challenges/:id/checkins` | Submit daily check-in |
| `GET` | `/challenges/:id/checkins` | View challenge check-in logs |
| `POST` | `/challenges/:id/streak-freeze` | Apply streak freeze on missed day |
| `GET` | `/challenges/:id/streak-freeze` | Check freeze balance & history |
| `GET` | `/challenges/:id/leaderboard` | View cumulative squad leaderboard |
| `POST` | `/challenges/:id/messages` | Send message to challenge chat (MongoDB) |
| `GET` | `/challenges/:id/messages` | Retrieve challenge chat history (MongoDB) |
| `GET` | `/users/me/dashboard` | Get dashboard overview statistics |
| `GET` | `/users/me/history` | Get user challenge participation history |
| `GET` | `/users/me/checkins` | Get personal check-in logs |

---

## Running Automated Tests

```bash
cd backend
npm run test:api
```

Verifies all 9 core test suites end-to-end:
1. Server Health
2. User Authentication & Sessions (Registration, Login, Duplicate Rejection, Protected Routes, Logout)
3. Challenge Management (Public & Private Creation, Invite Codes, Update, Delete)
4. Memberships (Join, Duplicate Prevention, Leave, Member Roster)
5. Daily Check-ins (Submission, Composite Unique Constraint Duplicate Prevention)
6. Streak Freeze (Freeze Past Missed Day, Inventory Decrement, Prevent Multiple Freezes)
7. Challenge Leaderboard (PostgreSQL `DENSE_RANK()` & `COUNT()`)
8. Dashboard & User History (Overview Stats, Active Challenges)
9. MongoDB Group Chat (Send, Retrieve, Delete Own Message)

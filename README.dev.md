# 💬 ChatBot Pro — Phase 1: Rule-Based FAQ Chatbot

A professional, full-stack chatbot system built with a clean, modular architecture designed for Phase 1 (rule-based mapping) and seamlessly extensible to Phase 2 (AI/NLP).

---

## 🏗 Architecture Decision

| Layer      | Technology                  | Reason                                                                           |
| Frontend   React 18 + Vite  Conent-based, fast HMR, CSS Modules for scoped styling

| Backend    | Node.js + Express           | Lightweight, async-friendly, huge ecosystem for AI libs in Phase 2              |
| Database   | SQLite (better-sqlite3)     | Zero-config, file-based, synchronous API — swappable with PostgreSQL            |
| Auth       | JWT (jsonwebtoken)          | Stateless, scalable, works across services                                       |
| Routing    | React Router v6             | Declarative, nested routes, protected route support                              |
| Styling    | CSS Modules + CSS Variables | Scoped, no runtime overhead, clean dark/light theming                           |

---

## 📁 Full Project Structure

### chatbot/

│
├── backend/                          ← Express API server
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js           ← SQLite init, schema creation, admin seeding
│   │   ├── middleware/
│   │   │   └── auth.js               ← JWT verify + requireAdmin guard
│   │   ├── routes/
│   │   │   ├── auth.js               ← /api/auth/*endpoints
│   │   │   ├── chat.js               ← /api/chat/* endpoints (public)
│   │   │   └── admin.js              ← /api/admin/* endpoints (admin only)
│   │   ├── controllers/
│   │   │   ├── authController.js     ← Login, register, /me logic
│   │   │   ├── chatController.js     ← Message matching engine + logging
│   │   │   └── adminController.js    ← FAQ CRUD, file upload, analytics
│   │   └── app.js                    ← Express setup, middleware wiring, server start
│   ├── uploads/                      ← Temporary upload directory (auto-created)
│   ├── chatbot.db                    ← SQLite database (auto-created on first run)
│   ├── package.json
│   └── .env.example                  ← Environment variable template
│
├── frontend/                         ← React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatBot/
│   │   │   │   ├── ChatWidget.jsx    ← FAB + chat window + message rendering
│   │   │   │   ├── ChatWidget.module.css
│   │   │   │   ├── FAQModal.jsx      ← FAQ picker modal with search
│   │   │   │   └── FAQModal.module.css
│   │   │   ├── Admin/
│   │   │   │   ├── AdminDashboard.jsx  ← Full admin panel (CRUD + upload + analytics)
│   │   │   │   └── AdminDashboard.module.css
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.jsx     ← Login + register form
│   │   │   │   └── LoginPage.module.css
│   │   │   ├── LandingPage.jsx       ← Demo homepage that embeds ChatWidget
│   │   │   ├── LandingPage.module.css
│   │   │   ├── ThemeToggle.jsx       ← Sun/moon toggle switch
│   │   │   └── ThemeToggle.module.css
│   │   ├── contexts/
│   │   │   ├── ThemeContext.jsx      ← Dark/light mode state + localStorage persistence
│   │   │   └── AuthContext.jsx       ← JWT token + user state management
│   │   ├── services/
│   │   │   └── api.js                ← Axios instance with auto-JWT injection
│   │   ├── App.jsx                   ← Router + providers setup
│   │   ├── main.jsx                  ← ReactDOM render entry
│   │   └── index.css                 ← Global CSS variables, design tokens, animations
│   ├── index.html                    ← HTML shell (RTL, Vazirmatn font)
│   ├── vite.config.js                ← Vite config + /api proxy
│   └── package.json
│
├── sample-data/
│   ├── faqs.json                     ← Sample FAQ data (JSON format)
│   ├── faqs.csv                      ← Sample FAQ data (CSV format)
│   └── faqs.txt                      ← Sample FAQ data (pipe-separated TXT)
│
└── README.md                         ← This file

```

---

## 🗃 Database Schema

### `users` table

Stores both admin and regular user accounts.

```sql
CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,          -- bcrypt hash (cost 12)
  role        TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### `faqs` table

The core Q&A pairs. Each question maps to exactly one answer.

```sql
CREATE TABLE faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT    NOT NULL,
  answer      TEXT    NOT NULL,
  category    TEXT    DEFAULT 'general',   -- grouping for UI display
  is_active   INTEGER NOT NULL DEFAULT 1,  -- soft-delete (0 = hidden from users)
  sort_order  INTEGER NOT NULL DEFAULT 0,  -- manual ordering
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

### `chat_logs` table

Logs every user message + bot response for analytics and future AI training.

```sql
CREATE TABLE chat_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    TEXT    NOT NULL,           -- UUID per browser session
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message       TEXT    NOT NULL,           -- user's input
  response      TEXT,                       -- bot's response
  faq_id        INTEGER REFERENCES faqs(id) ON DELETE SET NULL,
  matched       INTEGER NOT NULL DEFAULT 0, -- 1 = match found
  source        TEXT    DEFAULT 'text',     -- 'text' | 'faq_button'
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## 🔌 API Reference

### Auth

| Method | Endpoint           | Auth     | Description            |
|--------|--------------------|----------|------------------------|
| POST   | `/api/auth/login`  | None     | Login (user or admin)  |
| POST   | `/api/auth/register` | None   | Register new user      |
| GET    | `/api/auth/me`     | Bearer   | Get current user info  |

### Chat (Public)

| Method | Endpoint              | Auth     | Description                    |
|--------|-----------------------|----------|--------------------------------|
| GET    | `/api/chat/welcome`   | None     | Get welcome message            |
| GET    | `/api/chat/faqs`      | None     | Get active FAQ list            |
| POST   | `/api/chat/message`   | Optional | Send message, get response     |

**POST `/api/chat/message` body:**

```json
{
  "message": "ساعت کاری شما چیست؟",
  "session_id": "uuid-string",
  "faq_id": 3,
  "source": "text"
}
```

### Admin (All require `Bearer token` with `role=admin`)

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | `/api/admin/faqs`           | List all FAQs                   |
| POST   | `/api/admin/faqs`           | Create FAQ                      |
| PUT    | `/api/admin/faqs/:id`       | Update FAQ                      |
| DELETE | `/api/admin/faqs/:id`       | Soft/hard delete FAQ            |
| POST   | `/api/admin/faqs/upload`    | Bulk upload (JSON/CSV/TXT)      |
| GET    | `/api/admin/analytics`      | Dashboard statistics            |

---

## 🧠 Matching Engine (chatController.js)

The engine attempts 4 strategies in order, stopping at the first match:

1. **Exact match** — case-insensitive, trimmed comparison
2. **Substring match** — FAQ question contains user's full input
3. **Reverse substring** — user's input contains a FAQ question
4. **Token overlap** — word-level similarity ≥ 40% match rate

All matches are logged to `chat_logs` with `matched=1|0` for analytics.

---

## 🚀 Running Locally (Windows)

### Prerequisites

- Node.js 18+ — <https://nodejs.org>
- npm (bundled with Node)
- Git (optional)

### Step 1 — Clone / Extract the project

```
chatbot/
├── backend/
├── frontend/
└── README.md
```

### Step 2 — Backend Setup

Open **Command Prompt** or **PowerShell** in the `backend/` folder:

```cmd
cd chatbot\backend

REM Install dependencies
npm install

REM Copy environment file
copy .env.example .env

REM (Optional) Edit .env to change JWT_SECRET and admin credentials
notepad .env

REM Create uploads directory
mkdir uploads

REM Start development server
npm run dev
```

The backend will start at: **<http://localhost:5000>**

On first run, it will:

- Create `chatbot.db` (SQLite database)
- Create all tables
- Seed default admin: `admin / Admin@1234`

### Step 3 — Frontend Setup

Open a **new** Command Prompt window in the `frontend/` folder:

```cmd
cd chatbot\frontend

REM Install dependencies
npm install

REM Start development server
npm run dev
```

The frontend will start at: **<http://localhost:5173>**

### Step 4 — Open in Browser

Navigate to: **<http://localhost:5173>**

- Click the **💬 chat icon** (bottom-left) to open the chatbot
- Visit **<http://localhost:5173/login>** to log in
- Admin credentials: `admin` / `Admin@1234`
- After admin login, you'll be redirected to `/admin`

### Step 5 — Load Sample Data (Optional)

In the Admin Dashboard:

1. Go to **📁 آپلود فایل**
2. Click the drop zone
3. Select `sample-data/faqs.json`
4. Click upload

---

## 🔧 Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# JWT — CHANGE THIS in production!
JWT_SECRET=your-long-random-secret-string-here
JWT_EXPIRES_IN=24h

# Default admin (only used for initial DB seeding)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@1234

# Frontend origin for CORS
CORS_ORIGIN=http://localhost:5173

# Database file path
DB_PATH=./chatbot.db
```

---

## 🏗 Build for Production

### Backend

The backend runs directly with Node — no build step needed.

```cmd
cd backend
set NODE_ENV=production
node src/app.js
```

For production, use **PM2** for process management:

```cmd
npm install -g pm2
pm2 start src/app.js --name chatbot-api
pm2 save
pm2 startup
```

### Frontend

```cmd
cd frontend
npm run build
```

This creates a `dist/` folder with static files. Serve with:

- **Nginx** (recommended)
- **Apache**
- `npm run preview` (for testing the build locally)

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Serve React app
    root /var/www/chatbot/frontend/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # Proxy API to Node backend
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (cost factor 12)
- JWT tokens expire in **24 hours** (configurable)
- Login is **rate-limited** to 10 attempts per 15 minutes per IP
- Chat messages are rate-limited to 60/minute per IP
- **Helmet.js** sets security headers
- CORS is restricted to the configured frontend origin
- File uploads are validated by extension and limited to 5 MB

---

## 🛣 Phase 2 Upgrade Guide

The architecture was specifically designed with Phase 2 in mind. Here's how to extend each part:

### 1. Add AI/NLP Matching

In `backend/src/controllers/chatController.js`, the `sendMessage` function has clear upgrade points:

```javascript
// PHASE 2: Replace this rule-based block:
if (!matched && message) {
  // ... current 4-strategy matching ...
}

// WITH an AI service call:
if (!matched && message) {
  const aiResult = await aiService.match(message, activeFaqs);
  response = aiResult.answer;
  matched_faq_id = aiResult.faqId;
  matched = aiResult.confidence > 0.7;
}
```

Create `backend/src/services/aiService.js`:

```javascript
// Option A: OpenAI
const { OpenAI } = require('openai');
// Option B: Anthropic Claude
const Anthropic = require('@anthropic-ai/sdk');
// Option C: Local model via Ollama
```

### 2. Add Multi-Language Support

- Add a `language` column to the `faqs` table
- Add `Accept-Language` header parsing in `chatController.js`
- Store translations per FAQ entry or use a separate `faq_translations` table

### 3. Migrate to PostgreSQL

In `database.js`, swap `better-sqlite3` for `pg` (node-postgres):

```javascript
// Replace:
const Database = require('better-sqlite3');
// With:
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

The SQL schema is already compatible with PostgreSQL with minor adjustments.

### 4. Add WebSocket Support

Replace HTTP polling with real-time messaging:

```javascript
// In app.js, add:
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: CORS_ORIGIN } });
```

### 5. Add Conversation Context / Memory

The `chat_logs` table already stores full session history. In Phase 2:

```javascript
// Retrieve conversation history for context:
const history = db.prepare(
  'SELECT message, response FROM chat_logs WHERE session_id = ? ORDER BY created_at'
).all(session_id);
// Pass history to your AI provider for context-aware responses
```

---

## 📦 Dependencies

### Backend

| Package              | Version | Purpose                           |
|----------------------|---------|-----------------------------------|
| express              | ^4.18   | HTTP server framework             |
| better-sqlite3       | ^9.4    | SQLite database driver            |
| bcryptjs             | ^2.4    | Password hashing                  |
| jsonwebtoken         | ^9.0    | JWT authentication                |
| multer               | ^1.4    | File upload handling              |
| csv-parse            | ^5.5    | CSV file parsing                  |
| cors                 | ^2.8    | Cross-Origin Resource Sharing     |
| helmet               | ^7.1    | HTTP security headers             |
| express-rate-limit   | ^7.2    | API rate limiting                 |
| dotenv               | ^16.4   | Environment variable loading      |
| uuid                 | ^9.0    | Session ID generation             |
| nodemon (dev)        | ^3.0    | Auto-restart on file changes      |

 Frontend

| Package              | Version | Purpose                           |
|----------------------|---------|-----------------------------------|
| react                | ^18.2   | UI library                        |
| react-dom            | ^18.2   | DOM rendering                     |
| react-router-dom     | ^6.22   | Client-side routing               |
| axios                | ^1.6    | HTTP client with interceptors     |
| uuid                 | ^9.0    | Session ID generation             |
| vite (dev)           | ^5.1    | Build tool + dev server           |
| @vitejs/plugin-react | ^4.2    | React fast-refresh support        |

---

## 🌐 Application Routes

| Route    | Description                              | Access   |
|----------|------------------------------------------|----------|
| `/`      | Landing page with embedded ChatWidget    | Public   |
| `/login` | Login / Register page                    | Public   |
| `/admin` | Admin dashboard                          | Admin only (JWT) |

---

## 🎨 Design System

The UI uses a CSS custom property (variable) based design system defined in `index.css`:

- **Font**: Vazirmatn (Persian/Latin, Google Fonts)
- **Themes**: Light + Dark, toggled via `[data-theme]` attribute on `<html>`
- **Colours**: Brand blue (#3b82f6), Accent purple (#8b5cf6), semantic green/red/amber
- **Radius**: Consistent scale from `--radius-sm` (6px) to `--radius-full` (9999px)
- **Shadows**: 4-level shadow scale
- **Animations**: fadeIn, fadeInScale, slideUp, typingDot, pulse, bounce

---

## 🐛 Troubleshooting

**Port already in use:**

```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Database locked error:**

- Only one backend process should run at a time with SQLite
- In production, migrate to PostgreSQL for concurrent access

**CORS errors:**

- Ensure `CORS_ORIGIN` in `.env` exactly matches the frontend URL (including port)

**Build errors (Windows path issues):**

- Use forward slashes in `DB_PATH` or relative paths

---

## 📝 License

This project is provided as a complete reference implementation. Modify freely for your use case.

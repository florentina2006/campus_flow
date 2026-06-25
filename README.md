# Hackathon Backend

## Stack
- Node.js + Express
- Supabase (PostgreSQL database)
- Groq AI (LLaMA3)
- JWT Authentication

---

## Step 1 — Set Up Supabase

1. Go to https://supabase.com and create a free account
2. Click "New Project" — name it anything, pick a region close to India
3. Wait ~2 minutes for it to spin up
4. Go to **SQL Editor** (left sidebar) and run this SQL to create your tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  deadline TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

5. Go to **Settings → API** and copy:
   - `Project URL` → SUPABASE_URL in your .env
   - `anon public` key → SUPABASE_ANON_KEY in your .env

---

## Step 2 — Get Groq API Key

1. Go to https://console.groq.com
2. Sign up (free)
3. Go to **API Keys** → Create a key
4. Copy it → GROQ_API_KEY in your .env

---

## Step 3 — Install & Run

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env with your keys from Steps 1 and 2
npm run dev
```

Server starts at http://localhost:5000

---

## API Endpoints

### Auth (no token needed)
```
POST /api/auth/register
Body: { "name": "Ravi", "email": "ravi@test.com", "password": "123456" }

POST /api/auth/login
Body: { "email": "ravi@test.com", "password": "123456" }
```
Both return a `token`. Save this token — send it in every other request.

### Tasks (token required)
Send header: `Authorization: Bearer <your_token>`
```
GET    /api/tasks           → get all your tasks
POST   /api/tasks           → create task — body: { title, description, deadline, priority }
PUT    /api/tasks/:id       → update task — body: any fields to update
DELETE /api/tasks/:id       → delete task
```

### AI (token required)
```
POST /api/ai/summarize
Body: { "notice": "College notice text here..." }

POST /api/ai/flashcards
Body: { "notes": "Lecture notes text here..." }
```

---

## Testing with Postman or Thunder Client

1. Register → copy the token from response
2. For every task/AI request, go to Headers tab → add:
   - Key: `Authorization`
   - Value: `Bearer eyJhbGci...` (your token)

---

## Folder Structure

```
backend/
├── src/
│   ├── controllers/
│   │   ├── authController.js   ← register + login logic
│   │   ├── taskController.js   ← CRUD logic
│   │   └── aiController.js     ← Groq AI calls
│   ├── routes/
│   │   ├── authRoutes.js       ← maps URLs to auth controllers
│   │   ├── taskRoutes.js       ← maps URLs to task controllers
│   │   └── aiRoutes.js         ← maps URLs to AI controllers
│   ├── middleware/
│   │   └── auth.js             ← JWT verification
│   ├── config/
│   │   └── supabase.js         ← Supabase client
│   ├── app.js                  ← Express setup + route mounting
│   └── server.js               ← starts the HTTP server
├── .env                        ← your secrets (DO NOT commit)
├── .env.example                ← template (safe to commit)
├── .gitignore
└── package.json
```

---

## Telling Your Frontend Teammate the Base URL

During hackathon: `http://localhost:5000`
They prefix all calls with this. Example: `axios.post('http://localhost:5000/api/auth/login', ...)`

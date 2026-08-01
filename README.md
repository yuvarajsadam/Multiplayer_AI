# Multiplayer AI Workspace – Real-Time Collaborative AI System

> A production-ready web platform where multiple users join shared workspace rooms to edit prompts, guide AI responses, switch AI personas dynamically, stream token-by-token responses live, track prompt versions, and see real-time presence (Google Docs for AI interactions).
 
---

## ⚡ Core Features

1. **Room System**:
   - Create unique room codes or join via share (`?room=code`).
   - Multi-user collaborative workspaces.

2. **Real-Time Collaboration**:
   - Live WebSocket draft prompt synchronization across all connected clients.
   - Live typing indicators (`user typing a prompt...`).
   - User presence badges and color-coded avatars.

3. **AI Personas (Dynamic Role Switcher)**:
   - **Coder AI**: Pragmatic code-first solutions.
   - **Architect AI**: High-level system design & trade-off analysis.
   - **Reviewer AI**: Security audit, quality control & edge cases.

4. **Token-by-Token AI Streaming**:
   - Real-time token streaming broadcasted live via Socket.io.
   - Works with official OpenAI API (`gpt-3.5-turbo` / `gpt-4o`) or built-in intelligent fallback streamer when no key is set.

5. **Prompt Versioning**:
   - Every prompt re-execution creates a version increment (`v1`, `v2`, `v3`).
   - Detailed modal to view, compare, and restore previous prompt snapshots.

6. **MongoDB Persistence & Offline Resilience**:
   - Full Mongoose schema implementation.
   - In-memory store fallback so the app works instantly without requiring MongoDB local setup.

---

## 🛠 REST API Endpoints

| Method | Endpoint | Description | Payload / Query |
| flex | `POST /api/rooms/create` | Create a new room | `{ "name": "System Design Session" }` |
| `POST` | `POST /api/rooms/join` | Join an existing room | `{ "roomId": "demo-room", "userName": "Alex" }` |
| `GET` | `GET /api/rooms/:roomId` | Get room metadata | Params: `roomId` |
| `GET` | `GET /api/rooms/:roomId/history` | Get room message history | Params: `roomId` |

---

## 🔌 WebSocket Events

### Client -> Server:
- `join_room`: `{ roomId, user: { id, name, color } }`
- `edit_prompt`: `{ roomId, prompt, editor }` (Live draft sync)
- `send_prompt`: `{ roomId, prompt, role, author, originalMessageId }`
- `switch_role`: `{ roomId, role, user }`
- `typing`: `{ roomId, isTyping, user }`
- `vote_prompt`: `{ roomId, messageId, voteType, userId }`

### Server -> Client Broadcast:
- `user_joined`: `{ user, activeUsers }`
- `user_left`: `{ userId, userName, activeUsers }`
- `typing`: `{ typingUsers }`
- `prompt_updated`: `{ prompt, editor }`
- `role_switched`: `{ role, user }`
- `ai_stream_start`: `{ messageId, prompt, role, version, author }`
- `ai_stream_chunk`: `{ messageId, chunk, accumulated }`
- `ai_stream_end`: `{ messageId, message }`
- `prompt_voted`: `{ messageId, votes }`

---

## ⚙️ Step-by-Step Setup Instructions

### Prerequisites:
- Node.js (v18+)
- npm or yarn
- MongoDB (optional - automatically uses in-memory store if offline)

### 1. Backend Setup:
```bash
cd backend
npm install
```

Create `.env` file inside `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/multiplayer-ai-workspace
GEMINI_API_KEY=your_google_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

Start Backend Server:
```bash
npm run dev
# Server will start on http://localhost:5000
```

### 2. Frontend Setup:
Open a new terminal tab:
```bash
cd frontend
npm install
```

Start Frontend Dev Server:
```bash
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🧪 Testing Multi-User Collaboration Locally

1. Open `http://localhost:5173` in Browser Tab 1 (Alex).
2. Open `http://localhost:5173?room=demo-room` in Browser Tab 2 (Elena) or Incognito Window.
3. Start typing a prompt in Tab 1 – observe live typing indicator and instant character-by-character draft update in Tab 2.
4. Click **Execute** – observe real-time token-by-token streaming AI response appearing simultaneously in both tabs.
5. Switch AI Persona to **Architect AI** – observe live persona update sync across all participants.

---

## 🚀 Production Deployment Guide

### Deploying Backend on Render.com:
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New Web Service**.
3. Select your GitHub repository.
4. Set **Root Directory**: `backend`
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `node server.js`
7. Add Environment Variables:
   - `PORT`: `5000`
   - `MONGODB_URI`: Your MongoDB Atlas Connection String
   - `OPENAI_API_KEY`: Your OpenAI Secret API Key
   - `CLIENT_URL`: `https://your-frontend-domain.vercel.app`

### Deploying Frontend on Vercel.com:
1. Go to [Vercel Dashboard](https://vercel.com/) -> **Add New Project**.
2. Select your GitHub repository.
3. Set **Root Directory**: `frontend`
4. Set Framework Preset: **Vite**
5. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-service.onrender.com`
6. Click **Deploy**.

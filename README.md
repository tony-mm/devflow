# DevFlow AI

DevFlow AI is a full-stack, demo-ready automated code review and PR assistant. It scans a target folder, streams live agent updates to the UI, and returns a structured review with severity-tagged issues, a score, and a PR description draft.

## Tech Stack
- Frontend: React (Vite) + CSS
- Backend: Node.js + Express
- AI: OpenRouter API (OpenAI-compatible)
- Storage: In-memory with demo fallback JSON

## Setup

### 1) Install dependencies
```bash
cd server
npm install

cd ../client
npm install
```

### 2) Add environment variables
Create server/.env:
```env
OPENROUTER_API_KEY=your_key_here
PORT=3001
```

### 3) Run the app
```bash
# Terminal 1
cd server
npm start

# Terminal 2
cd client
npm run dev
```

Visit http://localhost:5173

## Demo Walkthrough
1. Open the Dashboard.
2. Keep the default target path (./client/src) for a self-review demo.
3. Click Run Review and watch the streaming log update in real time.
4. Open a review card to see file-level issues, score gauge, and auto-fix preview.
5. Generate a PR description and copy it for your demo narrative.

## Architecture

```
+----------------------+           SSE            +-----------------------+
|  React Dashboard UI  | <----------------------> |  Express SSE Endpoint  |
|  - Dashboard         |                          |  /api/stream           |
|  - Review Page       |                          +-----------+-----------+
+----------+-----------+                                      |
           |  REST                                            | Agent Loop
           v                                                  v
+----------------------+                          +------------------------+
|  Express API         | -----------------------> |  OpenRouter AI          |
|  /api/review         |                          |  Llama 3.3 Instruct     |
|  /api/fix            |                          +------------------------+
|  /api/pr-description |
+----------------------+
```

## API Endpoints
- GET /api/reviews
- POST /api/review { targetPath }
- POST /api/fix { filePath, issue, targetPath }
- POST /api/pr-description { diff }
- GET /api/stream (SSE logs)

## Tech Decisions
- **SSE for streaming:** Lightweight, browser-native, and ideal for streaming agent steps.
- **Agentic loop:** Explicit list-read-analyze structure makes the review process transparent.
- **OpenRouter:** Easy model switching and OpenAI-compatible API surface.
- **No database:** In-memory storage keeps the demo fast; mock JSON provides a fallback.

## Notes
- If OPENROUTER_API_KEY is missing, the backend automatically serves mock review data.
- Use the Review Page to run auto-fix suggestions and view the diff side-by-side.

Build me a full-stack project called "DevFlow AI" — an automated code review and PR assistant. This is for a Claude Code Automation Specialist interview so it needs to be impressive, functional, and demo-ready.

## Tech Stack
- Frontend: React (Vite) + CSS (no Tailwind)
- Backend: Node.js + Express
- AI: OpenRouter API (openai-compatible) using model "meta-llama/llama-3.3-8b-instruct:free"
- No database needed — in-memory storage is fine

## Project Structure
devflow-ai/
  server/
    index.js         # Express server
    agent.js         # OpenRouter AI agent with tool use
    fileTools.js     # File reading/analysis tools
    .env.example
  client/
    src/
      App.jsx
      components/    # ReviewCard, DiffViewer, FileTree, StatusBadge
      pages/         # Dashboard, ReviewPage
      hooks/         # useReview.js
    index.html
  README.md

## Core Features to Build

### 1. Backend Agent (agent.js)
- Connect to OpenRouter using fetch with base URL: https://openrouter.ai/api/v1/chat/completions
- Use model: meta-llama/llama-3.3-8b-instruct:free
- Authorization header: Bearer ${OPENROUTER_API_KEY}
- Implement an agentic loop with these tools:
  - read_file(path) — reads a file from the target directory
  - list_files(directory) — lists files recursively
  - analyze_code(code, filename) — sends code for AI review
- The agent should: list files → read each JS/TS/JSX file → analyze → compile results

### 2. API Endpoints (server/index.js)
- POST /api/review — accepts { targetPath: string }, runs the agent, returns review results
- POST /api/fix — accepts { filePath, issue }, returns AI-suggested fix with diff
- POST /api/pr-description — accepts { diff: string }, returns a generated PR description
- GET /api/reviews — returns history of past reviews (in-memory array)

### 3. Review Result Shape
Each review should return:
{
  id, timestamp, targetPath,
  files: [{ path, issues: [{ line, severity: 'error'|'warning'|'info', message, suggestion }] }],
  summary: string,
  score: number (0-100),
  prDescription: string
}

### 4. Frontend Dashboard (React)
Dark theme, terminal/industrial aesthetic using monospace fonts (JetBrains Mono from Google Fonts).
Color palette: #0a0a0a background, #00ff88 accent (green), #ff4444 errors, #ffaa00 warnings, #4488ff info.

Pages:
- Dashboard: shows review history cards, a path input to trigger new review, live streaming status
- ReviewPage: shows full review results — file tree on left, issues list on right, score gauge at top, copy PR description button

Components:
- FileTree — collapsible tree showing files with issue counts
- IssueCard — shows severity badge, line number, message, suggestion
- ScoreGauge — animated circular score (SVG)
- StreamingLog — shows live agent steps as they happen (SSE or polling)
- DiffViewer — shows before/after for auto-fix suggestions

### 5. Streaming (Important for Demo)
Use Server-Sent Events (SSE) so the UI shows the agent working in real-time:
- "🔍 Scanning directory..."
- "📄 Reading file: src/App.jsx"
- "🤖 Analyzing code quality..."
- "✅ Review complete!"

Emit these from the backend as the agent progresses, display them live in the UI.

### 6. Auto-Fix Feature
When user clicks "Auto Fix" on an issue:
- Call POST /api/fix with the file path and issue
- AI returns corrected code
- Show a diff view (original vs fixed) side by side
- "Copy Fix" button to copy the corrected snippet

### 7. PR Description Generator
- After review completes, show a "Generate PR Description" button
- Calls /api/pr-description with a summary of changes found
- Returns a formatted markdown PR description
- Show it in a modal with a copy button

## .env.example
OPENROUTER_API_KEY=your_key_here
PORT=3001

## README.md
Write a thorough README with:
- What the project does
- Setup instructions (npm install in both /server and /client)
- How to run (two terminals: node server/index.js and npm run dev in client/)
- Demo walkthrough (point it at its own source folder for review)
- Architecture diagram in ASCII art
- Tech decisions explanation (why SSE, why agentic loop, why OpenRouter)

## Important Notes
- Handle OpenRouter errors gracefully (rate limits, model unavailable)
- The demo target path should default to the project's own /client/src folder so it reviews itself — very impressive in a demo
- Add a sample .json of mock review data so it works even if API key isn't set (demo mode)
- Make sure CORS is enabled on the backend
- Add loading skeletons on the frontend while review runs

Start by creating the full file structure, then build backend first, then frontend.
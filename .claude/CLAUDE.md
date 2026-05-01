# DevFlow AI Project Overview

## Project Description
DevFlow AI is an automated code review and PR assistant that uses AI to analyze code, detect issues, suggest fixes, and generate PR descriptions. It's built as a full-stack application with a Node.js backend and a React Vite frontend, perfect for demonstrating advanced code analysis capabilities.

## How to Run the Backend
1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create your OpenRouter API key:
   - Copy the sample environment file:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your OpenRouter API key:
     ```env
     OPENROUTER_API_KEY=sk-your_actual_api_key_here
     PORT=3001
     ```

4. Start the server:
```bash
npm start
```

The backend will start on `http://localhost:3001` with SSE streaming capabilities.

## How to Run the Frontend
1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000` and automatically connect to the backend API.

## Configuration
- **Environment Variables**: All configuration is through `server/.env` - never modify `.env` directly, always use `.env.example` as a template
- **Environment Variables**:
  - `OPENROUTER_API_KEY`: Your OpenRouter API key (required for real API calls)
  - `PORT`: Backend port (defaults to 3001)

## AI Configuration
- Model: `meta-llama/llama-3.3-8b-instruct:free` (used through OpenRouter API)
- The agent analyzes `.js`, `.jsx`, `.ts`, and `.tsx` files
- Provides:
  - Code quality score (0-100)
  - List of issues with severity (error/warning/info)
  - Suggestions for improvements
  - PR description generation
  - Fix suggestions with code diffs

## Features Implemented
- ✅ AI-powered code analysis using OpenRouter
- ✅ Real-time streaming updates (SSE)
- ✅ Issue detection with severity tagging
- ✅ Auto-fix suggestions with code diffs
- ✅ PR description generation in markdown
- ✅ Interactive dashboard with history
- ✅ Demo mode with mock data (when API key is missing)
- ✅ In-memory storage for reviews (persists during session)
- ✅ Proper CORS configuration for frontend-backend communication

## Development Notes
- The server falls back to demo mode if `OPENROUTER_API_KEY` is missing
- This is intentional to allow developers to test the UI without providing an API key
- Always test with mock data first, then switch to real API when ready
- Review history is limited to 50 entries to prevent memory issues
- Docker integration not required but could be added for deployment
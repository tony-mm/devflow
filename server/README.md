# DevFlow AI Backend

This is the backend server for DevFlow AI, a code review and PR assistant application built with React, Vite, and Node.js. It provides APIs for code analysis, fix suggestions, and PR description generation.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Create a `.env` file with your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_api_key_here
PORT=3001
```

3. Start the server:
```bash
npm start
```

## API Endpoints

- `GET /api/reviews` - Returns review history from memory
- `POST /api/review` - Analyzes code in a directory
- `POST /api/fix` - Generates code fixes for issues
- `POST /api/pr-description` - Creates PR descriptions from diffs

## Features

- AI-powered code analysis using OpenRouter
- Real-time streaming updates via WebSocket
- Code review history storage
- Error handling and logging

## License

MIT License
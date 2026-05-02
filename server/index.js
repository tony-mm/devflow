require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { runAgentReview, hasApiKey, suggestFixWithAI, generatePrDescriptionWithAI } = require('./agent');
const { readFileAsync } = require('./fileTools');

const app = express();
const PORT = process.env.PORT || 3001;
const PROJECT_ROOT = path.join(__dirname, '..');
const MOCK_REVIEW_PATH = path.join(__dirname, 'mockReview.json');

const sseClients = new Set();
let reviews = [];

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
}));
app.use(express.json());

function sendSseEvent(message) {
    const payload = JSON.stringify({
        type: 'log',
        message,
        timestamp: new Date().toISOString(),
    });

    for (const res of sseClients) {
        res.write(`data: ${payload}\n\n`);
    }
}

async function loadMockReview(targetPath) {
    const content = await fs.readFile(MOCK_REVIEW_PATH, 'utf-8');
    const mock = JSON.parse(content);
    return {
        ...mock,
        id: `mock-${Date.now()}`,
        timestamp: new Date().toISOString(),
        targetPath,
    };
}

app.get('/api/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });

    res.write(`data: ${JSON.stringify({ type: 'log', message: 'Stream connected', timestamp: new Date().toISOString() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
        sseClients.delete(res);
    });
});

app.get('/api/reviews', (req, res) => {
    res.json(reviews);
});

app.post('/api/review', async (req, res) => {
    const requestedPath = req.body?.targetPath || path.join('client', 'src');
    const targetPath = path.isAbsolute(requestedPath)
        ? requestedPath
        : path.join(PROJECT_ROOT, requestedPath);
    sendSseEvent('Scanning directory...');
    sendSseEvent(`Target: ${targetPath}`);

    try {
        let review;
        if (!hasApiKey()) {
            sendSseEvent('API key missing, using demo data.');
            review = await loadMockReview(targetPath);
        } else {
            try {
                review = await runAgentReview({
                    targetPath,
                    emitLog: sendSseEvent,
                });
            } catch (error) {
                console.error('OpenRouter error:', error);
                sendSseEvent('OpenRouter error, falling back to demo data.');
                review = await loadMockReview(targetPath);
            }
        }

        sendSseEvent('Review complete!');
        reviews.unshift(review);
        reviews = reviews.slice(0, 50);
        res.json(review);
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({
            error: 'Could not complete review',
            details: error.message,
        });
    }
});

app.post('/api/fix', async (req, res) => {
    try {
        const { filePath, issue, targetPath } = req.body || {};
        if (!filePath || !issue) {
            return res.status(400).json({ error: 'filePath and issue are required' });
        }

        const basePath = targetPath
            ? (path.isAbsolute(targetPath) ? targetPath : path.join(PROJECT_ROOT, targetPath))
            : PROJECT_ROOT;
        const resolvedPath = path.isAbsolute(filePath)
            ? filePath
            : path.join(basePath, filePath);

        const code = await readFileAsync(resolvedPath);
        let fixResult;

        if (hasApiKey()) {
            try {
                fixResult = await suggestFixWithAI(code, filePath, issue);
            } catch (error) {
                console.error('Fix generation error:', error);
                // Fallback: try to load mock review data for a mock fix suggestion
                try {
                    const mockContent = await readFileAsync(MOCK_REVIEW_PATH);
                    const mock = JSON.parse(mockContent);
                    const mockSuggestion = mock.files?.[0]?.issues?.[0]?.suggestion || 'No suggestion available';
                    fixResult = {
                        fixedCode: code,
                        summary: `Using mock fix suggestion: ${mockSuggestion}`,
                    };
                } catch (_) {
                    fixResult = { fixedCode: code, summary: 'OpenRouter error, returning original code.' };
                }
            }
        } else {
            // No API key – also attempt to use mock data
            try {
                const mockContent = await readFileAsync(MOCK_REVIEW_PATH);
                const mock = JSON.parse(mockContent);
                const mockSuggestion = mock.files?.[0]?.issues?.[0]?.suggestion || 'No suggestion available';
                fixResult = {
                    fixedCode: code,
                    summary: `No API key, using mock fix suggestion: ${mockSuggestion}`,
                };
            } catch (_) {
                fixResult = { fixedCode: code, summary: 'No API key, returning original code.' };
            }
        }

        res.json({
            diff: {
                before: code,
                after: fixResult.fixedCode,
            },
            fixedCode: fixResult.fixedCode,
            summary: fixResult.summary,
        });
    } catch (error) {
        console.error('Fix error:', error);
        res.status(500).json({
            error: 'Could not generate fix',
            details: error.message,
        });
    }
});

app.post('/api/pr-description', async (req, res) => {
    try {
        const diff = req.body?.diff || req.body?.summary || 'No diff provided.';
        let description;

        if (hasApiKey()) {
            try {
                description = await generatePrDescriptionWithAI(diff);
            } catch (error) {
                description = null;
            }
        }

        if (!description) {
            // Try to use the mock review's PR description as a fallback.
            try {
                const mockContent = await readFileAsync(MOCK_REVIEW_PATH);
                const mock = JSON.parse(mockContent);
                description = mock.prDescription || [
                    '# PR Description',
                    '',
                    '## Summary',
                    diff,
                    '',
                    '## Changes',
                    '- Automated review findings summarized.',
                    '',
                    '## Testing',
                    '- Not run (demo mode).',
                ].join('\n');
            } catch (_) {
                // If mock data cannot be read, fall back to the static template.
                description = [
                    '# PR Description',
                    '',
                    '## Summary',
                    diff,
                    '',
                    '## Changes',
                    '- Automated review findings summarized.',
                    '',
                    '## Testing',
                    '- Not run (demo mode).',
                ].join('\n');
            }
        }

        res.json({ description });
    } catch (error) {
        res.status(500).json({
            error: 'Could not generate PR description',
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app };
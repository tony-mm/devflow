const fetch = global.fetch || ((...args) => import('node-fetch').then((mod) => mod.default(...args)));
const crypto = require('crypto');
const path = require('path');
const { listFilesAsync, readFileAsync } = require('./fileTools');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openrouter/free';

function hasApiKey() {
    return Boolean(process.env.OPENROUTER_API_KEY);
}

async function callOpenRouter(messages, options = {}) {
    if (!hasApiKey()) {
        throw new Error('OPENROUTER_API_KEY is not set');
    }

    const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
            model: MODEL,
            temperature: options.temperature ?? 0.2,
            messages,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter response error:', errorText);
        throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
}

function extractJson(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return trimmed;
    }

    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
        return trimmed.slice(first, last + 1);
    }
    return null;
}

function getLanguageFromFilename(filename) {
    const ext = path.extname(filename).toLowerCase();
    const langMap = {
        '.js': 'JavaScript', '.jsx': 'JavaScript (React)', '.ts': 'TypeScript', '.tsx': 'TypeScript (React)',
        '.py': 'Python', '.pyw': 'Python',
        '.cs': 'C#', '.csx': 'C#',
        '.go': 'Go',
        '.rs': 'Rust',
        '.java': 'Java',
        '.cpp': 'C++', '.cxx': 'C++', '.cc': 'C++', '.hpp': 'C++', '.h': 'C/C++',
        '.c': 'C',
        '.php': 'PHP', '.php3': 'PHP', '.php4': 'PHP', '.php5': 'PHP', '.phtml': 'PHP',
        '.css': 'CSS', '.scss': 'SCSS', '.sass': 'SASS', '.less': 'LESS',
        '.html': 'HTML', '.htm': 'HTML', '.xhtml': 'XHTML',
    };
    return langMap[ext] || 'code';
}

async function analyzeCodeWithAI(code, filename) {
    const language = getLanguageFromFilename(filename);
    const content = await callOpenRouter([
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `You are an expert ${language} code reviewer. Analyze the file ${filename} for issues, best practices, and improvements.`,
                },
                { type: 'text', text: code },
                {
                    type: 'text',
                    text: [
                        'Return ONLY valid JSON in this exact shape:',
                        '{',
                        '  "summary": "string",',
                        '  "score": number,',
                        '  "issues": [{ "line": number, "severity": "error|warning|info", "message": "string", "suggestion": "string" }]',
                        '}',
                    ].join('\n'),
                },
            ],
        },
    ]);

    const jsonText = extractJson(content);
    if (!jsonText) {
        return { summary: 'Parsing error', score: 0, issues: [] };
    }

    try {
        const analysis = JSON.parse(jsonText);
        return {
            summary: analysis.summary || 'No summary provided',
            score: typeof analysis.score === 'number' ? analysis.score : 50,
            issues: Array.isArray(analysis.issues) ? analysis.issues : [],
        };
    } catch (error) {
        return { summary: 'Parsing error', score: 0, issues: [] };
    }
}

async function suggestFixWithAI(code, filePath, issue) {
    const language = getLanguageFromFilename(filePath);
    const content = await callOpenRouter([
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: `You are fixing an issue in ${language} file ${filePath}. Provide a corrected version of the code.`,
                },
                {
                    type: 'text',
                    text: `Issue details: ${JSON.stringify(issue)}`,
                },
                { type: 'text', text: code },
                {
                    type: 'text',
                    text: [
                        'Return ONLY valid JSON in this exact shape:',
                        '{',
                        '  "fixedCode": "string",',
                        '  "summary": "string"',
                        '}',
                    ].join('\n'),
                },
            ],
        },
    ], { temperature: 0.1 });

    const jsonText = extractJson(content);
    if (!jsonText) {
        return { fixedCode: code, summary: 'No fix generated' };
    }

    try {
        const fix = JSON.parse(jsonText);
        return {
            fixedCode: fix.fixedCode || code,
            summary: fix.summary || 'Fix generated',
        };
    } catch (error) {
        return { fixedCode: code, summary: 'No fix generated' };
    }
}

async function generatePrDescriptionWithAI(diff) {
    const content = await callOpenRouter([
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: 'Generate a clear PR description in markdown from the following diff summary.',
                },
                { type: 'text', text: diff },
                {
                    type: 'text',
                    text: 'Return markdown only. Include Summary, Changes, and Testing sections.',
                },
            ],
        },
    ], { temperature: 0.3 });

    return content.trim();
}

function buildSummary(files) {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const file of files) {
        for (const issue of file.issues) {
            if (issue.severity === 'error') errorCount += 1;
            if (issue.severity === 'warning') warningCount += 1;
            if (issue.severity === 'info') infoCount += 1;
        }
    }

    return `Reviewed ${files.length} files. Errors: ${errorCount}. Warnings: ${warningCount}. Info: ${infoCount}.`;
}

function averageScore(results) {
    if (results.length === 0) return 50;
    const total = results.reduce((sum, item) => sum + (item.score || 0), 0);
    return Math.round(total / results.length);
}

function buildReview({ targetPath, files, summary, score, prDescription }) {
    return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        targetPath,
        files,
        summary,
        score,
        prDescription,
    };
}

async function runAgentReview({ targetPath, emitLog }) {
    const log = emitLog || (() => {});
    log('Scanning directory...');
    const allFiles = await listFilesAsync(targetPath);

    const candidates = allFiles.filter((file) => {
        const ext = path.extname(file.name).toLowerCase();
        return [
            '.js', '.jsx', '.ts', '.tsx',
            '.py', '.pyw',
            '.cs', '.csx',
            '.go',
            '.rs',
            '.java',
            '.cpp', '.cxx', '.cc', '.hpp', '.h',
            '.c',
            '.php', '.php3', '.php4', '.php5', '.phtml',
            '.css', '.scss', '.sass', '.less',
            '.html', '.htm', '.xhtml',
        ].includes(ext);
    });

    log(`Found ${candidates.length} files to analyze.`);

    const reviewFiles = [];
    const results = [];

    for (const file of candidates) {
        try {
            log(`Reading file: ${file.path}`);
            const code = await readFileAsync(file.fullPath);
            log(`Analyzing code quality: ${file.path}`);

            const analysis = await analyzeCodeWithAI(code, file.path);
            results.push(analysis);
            reviewFiles.push({
                path: file.path,
                issues: analysis.issues.map((issue) => ({
                    line: issue.line || 0,
                    severity: issue.severity || 'info',
                    message: issue.message || 'No message provided',
                    suggestion: issue.suggestion || 'No suggestion provided',
                })),
            });
        } catch (error) {
            console.error(`Error analyzing ${file.path}:`, error);
            log(`Error analyzing ${file.path}: ${error.message}`);
            reviewFiles.push({
                path: file.path,
                issues: [
                    {
                        line: 0,
                        severity: 'error',
                        message: 'Failed to analyze file.',
                        suggestion: 'Retry review or check OpenRouter status.',
                    },
                ],
            });
        }
    }

    const summary = buildSummary(reviewFiles);
    const score = averageScore(results);
    const prDescription = `# PR Description\n\n${summary}\n\n## Changes\n- Automated review generated findings.\n\n## Testing\n- Not run (automation).`;

    return buildReview({ targetPath, files: reviewFiles, summary, score, prDescription });
}

module.exports = {
    hasApiKey,
    analyzeCodeWithAI,
    suggestFixWithAI,
    generatePrDescriptionWithAI,
    runAgentReview,
};
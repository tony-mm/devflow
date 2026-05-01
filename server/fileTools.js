const fs = require('fs').promises;
const path = require('path');

async function readFileAsync(filePath) {
    try {
        return await fs.readFile(path.resolve(filePath), 'utf-8');
    } catch (error) {
        throw new Error(`Could not read file: ${filePath}`);
    }
}

async function listFilesAsync(directory) {
    const entries = [];

    async function walk(dir, relativePath = '') {
        const files = await fs.readdir(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const relPath = path.join(relativePath, file);
            const stat = await fs.stat(fullPath);
            if (stat.isDirectory()) {
                await walk(fullPath, relPath);
            } else {
                entries.push({
                    path: relPath.replace(/\\/g, '/'),
                    fullPath,
                    type: 'file',
                    name: file,
                    size: stat.size,
                });
            }
        }
    }

    await walk(path.resolve(directory));
    return entries;
}

module.exports = {
    readFileAsync,
    listFilesAsync,
};
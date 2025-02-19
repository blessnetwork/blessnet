const fs = require('node:fs');
const path = require('node:path');

const MIME_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.html': 'text/html',
    '.txt': 'text/plain'
};

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function scanJSFiles(dir) {
    const files = fs.readdirSync(dir);
    const staticPaths = [];

    files.forEach(file => {
        if (file.endsWith('.ts')) {
            const filePath = path.join(dir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const regex = /server\.statics\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;

            let match;
            while ((match = regex.exec(content)) !== null) {
                const directory = match[1];  // This captures "public"
                const route = match[2];      // This captures "/"
                staticPaths.push({
                    directory,
                    route,
                    sourcePath: filePath
                });
            }
        }
    });

    return staticPaths;
}

function createAssetsJson(staticPaths) {
    const assets = {};

    staticPaths.forEach(({ route, directory }) => {
        const publicDir = path.join(process.cwd(), directory);
        if (fs.existsSync(publicDir)) {
            const files = fs.readdirSync(publicDir, { recursive: true });
            files.forEach(file => {
                const filePath = path.join(publicDir, file);
                // Skip if it's a directory
                if (fs.statSync(filePath).isDirectory()) {
                    return;
                }
                try {
                    const fileContent = fs.readFileSync(filePath);
                    const contentType = getContentType(filePath);
                    const base64Content = fileContent.toString('base64');
                    assets[route + file] = `data:${contentType};base64,${base64Content}`;
                } catch (error) {
                    console.error(`Error processing file ${file}:`, error);
                }
            });
        }
    });

    fs.writeFileSync(
        path.join(process.cwd(), 'bls.assets.json'),
        JSON.stringify(assets, null, 2)
    );

    return assets;
}

module.exports = { scanJSFiles, createAssetsJson };

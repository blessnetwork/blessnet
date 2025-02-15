const express = require('express');
const path = require('node:path');
const { run } = require('./invoke'); // Import run function from invoke.js

function startServer() {
    const app = express();

    // Serve static files including .wasm
    app.use(express.static(path.join(process.cwd(), 'build')));

    // Handle all HTTP methods for any path
    app.all('*', async (req, res) => {
        try {
            const result = await run({
                stdin: JSON.stringify({
                    path: req.path,
                    method: req.method,
                })
            });

            // Check if result contains a type declaration
            const typeMatch = result.match(/^data:([^;]+);base64,/);
            if (typeMatch) {
                // Set the content type header and send the data
                res.setHeader('Content-Type', typeMatch[1]);
                res.send(Buffer.from(result.split(',')[1], 'base64'));
            } else {
                res.send(result);
            }
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });

    app.listen(3000, () => {
        console.log('Server listening at http://localhost:3000');
    });
}

module.exports = { startServer };

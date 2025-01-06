const express = require('express');
const path = require('node:path');
const { run } = require('./invoke'); // Import run function from invoke.js

function startServer() {
    const app = express();

    // Serve static files including .wasm
    app.use(express.static(path.join(process.cwd(), 'build')));

    app.get('/', async (req, res) => {
        try {
            const result = await run({ stdin: 'echo "hello"' }); // Use run function from invoke.js
            res.send(result);
        } catch (error) {
            res.status(500).send(`Error: ${error.message}`);
        }
    });

    app.listen(3000, () => {
        console.log('Server listening at http://localhost:3000');
    });
}

module.exports = { startServer };

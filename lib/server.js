const express = require('express');
const { execSync } = require('node:child_process');

function startServer() {
    const app = express();

    app.get('/', (req, res) => {
        const result = execSync('echo "hello"').toString();
        res.send(result);
    });

    app.listen(3000, () => {
        console.log('Server listening at http://localhost:3000');
    });
}

module.exports = { startServer };

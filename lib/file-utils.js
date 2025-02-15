const fs = require('fs');
const path = require('path');

function addStaticsImport(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('setStatics')) {
        const newContent = content.replace(
            /const server = new WebServer\(\);/,
            'const server = new WebServer();\nserver.setStatics(require("./bls.assets.json"));'
        );
        fs.writeFileSync(filePath, newContent);
    }
}

function removeStaticsImport(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(
        /\s*server\.setStatics\(require\("\.\/bls\.assets\.json"\)\);/,
        ''
    );
    fs.writeFileSync(filePath, newContent);
}

module.exports = {
    addStaticsImport,
    removeStaticsImport
};

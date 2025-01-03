const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const Chalk = require('chalk');

const createWasmArchive = (
    path,
    wasmArchive,
    wasmName
) => {
    console.log(`${Chalk.yellow("Creating Archive:")} ${wasmArchive} in ${path}`);
    execSync(`cd ${path} && tar zcf ./${wasmArchive} -C ${path} ${wasmName}`, {
        cwd: path,
        stdio: "ignore",
    });

    return readFileSync(`${path}/${wasmArchive}`);
};

module.exports = {
    createWasmArchive
};

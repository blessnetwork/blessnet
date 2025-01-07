const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const Chalk = require('chalk');
const fetch = require('node-fetch');

const submitWasmArchive = async (archiveBuffer, wasmArchive) => {
    const formData = new FormData();
    formData.append("wasmArchive", new Blob([archiveBuffer]), wasmArchive);

    const response = await fetch(`${host}/api/submit`, {
        method: 'POST',
        body: formData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

    if (!response.ok) {
        throw new Error('Failed to submit archive');
    }

    return await response.json();
};

const createWasmArchive = async (
    path,
    wasmArchive,
    wasmName
) => {
    console.log(`${Chalk.yellow("Creating Archive:")} ${wasmArchive} in ${path}`);
    execSync(`cd ${path} && tar zcf ./${wasmArchive} -C ${path} ${wasmName}`, {
        cwd: path,
        stdio: "ignore",
    });

    const archiveBuffer = readFileSync(`${path}/${wasmArchive}`);
    return await submitWasmArchive(archiveBuffer, wasmArchive);
};

module.exports = {
    createWasmArchive,
    submitWasmArchive
};

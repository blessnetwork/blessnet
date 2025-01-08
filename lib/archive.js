const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const Chalk = require('chalk');
const FormData = require('form-data');
const { Blob } = require('node:buffer');

const submitWasmArchive = async (archiveBuffer, wasmArchive, manifestBuffer) => {
    const fetch = (await import('node-fetch')).default;
    const formData = new FormData();
    formData.append("manifest", manifestBuffer, "manifest.json");
    formData.append("wasi_archive", archiveBuffer, wasmArchive);

    const response = await fetch("https://wasi.bls.dev/api/submit", {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
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
    execSync(`cd ${path} && tar zcf ./${wasmArchive} -C ${path} ${wasmName}`, {
        cwd: path,
        stdio: "ignore",
    });

    const archiveBuffer = readFileSync(`${path}/${wasmArchive}`);
    return archiveBuffer;
};

module.exports = {
    createWasmArchive,
    submitWasmArchive
};

const { execSync } = require('node:child_process');
const { platform } = require('node:process');
const Chalk = require('chalk');
const { https } = require('follow-redirects');
const fs = require('node:fs');
const path = require('node:path');
// Remove the require statement for temp-dir
// const tempDir = require('temp-dir');

const getOra = async () => {
    const { default: ora } = await import('ora');
    return ora;
};

const RUNTIME_BUILD_VERSION = 'v0.6.3';
const NETWORKING_BUILD_VERSION = 'v0.4.0';

const download = (url, dest) => new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
        .get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                resolve(dest);
            });
        })
        .on('error', (err) => {
            // Handle errors
            fs.unlink(dest, () => { }); // Delete the file async. (But we don't check the result)
            reject(err);
        });
});

const getRuntime = async () => {
    const tempDir = (await import('temp-dir')).default; // Dynamically import temp-dir
    const os =
        platform === 'win32'
            ? 'windows'
            : platform === 'darwin'
                ? 'macos'
                : 'linux';
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x86_64';
    const homedir = path.join(require('node:os').homedir(), '.blessnet')

    const ora = await getOra();
    const installSpinner = ora('Installing dependencies ...').start()

    installSpinner.text = 'Downloading runtime ...'

    const result = await download(
        `https://github.com/blocklessnetwork/runtime/releases/download/${RUNTIME_BUILD_VERSION}/blockless-runtime.${os}-latest.${arch}.tar.gz`,
        `${tempDir}/blockless-runtime.${os}-latest.${arch}.tar.gz`
    );

    installSpinner.text = 'Installing runtime ...'

    if (platform === 'win32') {
        execSync(
            `powershell -Command "Remove-Item -Recurse -Force ${homedir}\\bin; New-Item -ItemType Directory -Force ${homedir}\\bin; tar -xvf ${tempDir}\\blockless-runtime.${os}-latest.${arch}.tar.gz -C ${homedir}\\bin"`,
            { stdio: 'ignore' }
        );
    } else {
        execSync(
            `rm -rf ${homedir}/bin; mkdir -p ${homedir}/bin; tar -xvf ${tempDir}/blockless-runtime.${os}-latest.${arch}.tar.gz -C ${homedir}/bin`,
            { stdio: 'ignore' }
        );
    }

    installSpinner.succeed('Installation successful.')

    return null;
};


const getNetworking = async () => {
    const tempDir = (await import('temp-dir')).default; // Dynamically import temp-dir
    const os = platform === 'win32' ? 'windows' : platform;
    const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';

    const result = await download(
        `https://github.com/blocklessnetwork/b7s/releases/download/${NETWORKING_BUILD_VERSION}/b7s-${os}.${arch}.tar.gz`,
        `${tempDir}/b7s-${os}.${arch}.tar.gz`
    );

    if (platform === 'win32') {
        execSync(
            `powershell -Command "New-Item -ItemType Directory -Force ${homedir}\\bin; tar -xvf ${tempDir}\\b7s-${os}.${arch}.tar.gz -C ${homedir}\\bin"`,
            { stdio: 'ignore' }
        );
    } else {
        execSync(
            `mkdir -p ${homedir}/bin; tar -xvf ${tempDir}/b7s-${os}.${arch}.tar.gz -C ${homedir}/bin`,
            { stdio: 'ignore' }
        );
    }

    console.log(`${Chalk.green('Installing')} ... installed networking agent: ${os}/${arch}`);

    return null;
};

module.exports = {
    download,
    getRuntime,
    getNetworking
};

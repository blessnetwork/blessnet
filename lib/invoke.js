const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { parseBlsConfig } = require('./config'); // Import parseBlsConfig
const buildCommand = require('../commands/build'); // Import buildCommand

const run = async (options = {}) => {
    const homedir = path.join(require('node:os').homedir(), '.blessnet')
    const runtimePath = `${homedir}/bin/bls-runtime`;

    // Read and parse the toml file using config.js
    const tomlData = parseBlsConfig(process.cwd(), 'bls.toml');

    // Extract build directory
    const buildDir = tomlData.build.dir;

    // Define stdinString
    let stdinString = options.stdin || '';

    if (!stdinString) {
        let stdinData = '';
    
        if (!process.stdin.isTTY) {
            const chunks = [];
            for await (const chunk of process.stdin) {
                chunks.push(chunk);
            }
            stdinData = chunks.join('');
        }

        stdinString = stdinData;
    }

    // pass in stdin to the runtime
    stdinString = stdinString.replace(/"/g, '\\"');

    let envString = '';
    const envVars = [];
    const envVarsKeys = [];

    if (options.env) {
        // Validate environment variables
        const vars = typeof options.env === 'string' ? [options.env] : options.env;
        vars.map((v) => {
            const split = v.split('=');
            if (split.length !== 2) return;

            envVars.push(v);
            envVarsKeys.push(split[0]);
        });
    }

    // Include environment string if there are variables
    if (envVars.length > 0) {
        envString = `env ${envVars.join(' ')} BLS_LIST_VARS=\"${envVarsKeys.join(';')}\"`;
    }

    const targetPath = options.manifestPath || options.wasmPath || path.join(process.cwd(), buildDir, 'debug.wasm') || path.join(process.cwd(), buildDir, 'release.wasm'); // Ensure .wasm extension
    if (!targetPath) {
        throw new Error('Either manifestPath or wasmPath must be provided');
    }

    // Check if the build file exists
    // if (!fs.existsSync(targetPath)) {
    //     console.log('Build file not found, running build...');
    //     await buildCommand.parseAsync(['node', 'build.js', '--debug']); // Run build command with debug option
    // }

    await buildCommand.parseAsync(['node', 'build.js', '--debug']); // Run build command with debug option
    const result = execSync(`echo "${stdinString}" | ${envString} ${runtimePath} ${targetPath}`, {
        cwd: process.cwd(),
        maxBuffer: (10000 * 1024)
    }).toString();

    return result;
};

module.exports = { run };

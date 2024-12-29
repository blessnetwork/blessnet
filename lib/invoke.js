const { execSync } = require('node:child_process');
const path = require('node:path');

const run = async (options) => {
    const homedir = path.join(require('node:os').homedir(), '.blessnet')
    const runtimePath = `${homedir}/bin/bls-runtime`;

    // Define stdinString
    let stdinString = options.stdin || '';

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

    const targetPath = options.manifestPath || options.wasmPath;
    if (!targetPath) {
        throw new Error('Either manifestPath or wasmPath must be provided');
    }

    const result = execSync(`echo "${stdinString}" | ${envString} ${runtimePath} ${targetPath}`, {
        cwd: process.cwd(),
        maxBuffer: (10000 * 1024)
    }).toString();

    return result;
};

module.exports = { run };

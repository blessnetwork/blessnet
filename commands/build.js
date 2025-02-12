const { Command } = require('commander');
const { execSync } = require('node:child_process');
const { scanJSFiles, createAssetsJson } = require('../lib/find-static-paths');

const buildCommand = new Command('build')
    .description('Build the project')
    .option('--debug', 'Build in debug mode')
    .action((options) => {
        console.log('Scanning for static path configurations...');
        const staticPaths = scanJSFiles(process.cwd());
        createAssetsJson(staticPaths);
        console.log('Generated assets file: bls.assets.json');

        const buildCommand = options.debug ? 'npm run build:debug' : 'npm run build:release';
        execSync(buildCommand, { stdio: 'inherit' });
    });

module.exports = buildCommand;
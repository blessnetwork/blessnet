const { Command } = require('commander');
const { execSync } = require('node:child_process');
const { scanJSFiles, createAssetsJson } = require('../lib/find-static-paths');

const buildCommand = new Command('build')
    .description('Build the project')
    .option('--debug', 'Build in debug mode')
    .action((options) => {
        const staticPaths = scanJSFiles(process.cwd());

        if (staticPaths.length > 0) {
            createAssetsJson(staticPaths);
            console.log('Generated assets file: bls.assets.json');
        }

        const buildCommand = options.debug ? 'npm run build:debug' : 'npm run build:release';
        execSync(buildCommand, { stdio: 'inherit' });
    });

module.exports = buildCommand;
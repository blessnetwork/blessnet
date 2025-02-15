const { Command } = require('commander');
const { execSync } = require('node:child_process');
const { scanJSFiles, createAssetsJson } = require('../lib/find-static-paths');
const { addStaticsImport, removeStaticsImport } = require('../lib/file-utils');

const buildCommand = new Command('build')
    .description('Build the project')
    .option('--debug', 'Build in debug mode')
    .action((options) => {
        const staticPaths = scanJSFiles(process.cwd());

        if (staticPaths.length > 0) {
            createAssetsJson(staticPaths);

            // Add setStatics line to source files
            for (const { sourcePath } of staticPaths) {
                addStaticsImport(sourcePath);
            }
        }

        const buildCommand = options.debug ? 'npm run build:debug' : 'npm run build:release';
        execSync(buildCommand, { stdio: 'inherit' });

        // Remove setStatics line after build
        if (staticPaths.length > 0) {
            for (const { sourcePath } of staticPaths) {
                removeStaticsImport(sourcePath);
            }
        }
    });

module.exports = buildCommand;
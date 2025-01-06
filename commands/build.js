const { Command } = require('commander');
const { execSync } = require('node:child_process');

const buildCommand = new Command('build')
    .description('Build the project')
    .option('--debug', 'Build in debug mode') // Add debug option
    .action((options) => {
        const buildCommand = options.debug ? 'npm run build:debug' : 'npm run build:release';
        execSync(buildCommand, { stdio: 'inherit' });
    });

module.exports = buildCommand;
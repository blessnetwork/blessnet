
const { Command } = require('commander');
const { execSync } = require('node:child_process');

const buildCommand = new Command('build')
    .description('Build the project')
    .action(() => {
        execSync('npm run build:release', { stdio: 'inherit' });
    });

module.exports = buildCommand;
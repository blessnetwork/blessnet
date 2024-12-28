const { Command } = require('commander');
const { startServer } = require('../lib/server');
const { execSync } = require('node:child_process');

const previewCommand = new Command('preview')
    .description('Preview your project');

previewCommand
    .command('serve')
    .description('Start the preview server')
    .action(() => {
        startServer();
    });

previewCommand
    .action(() => {
        const result = execSync('echo "hello"').toString();
        console.log(result);
    });

module.exports = previewCommand;

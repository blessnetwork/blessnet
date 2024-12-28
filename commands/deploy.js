const { Command } = require('commander');

const deployCommand = new Command('deploy')
    .description('Deploy your project')
    .action(() => {
        console.log('Deploy command executed');
    });

module.exports = deployCommand;

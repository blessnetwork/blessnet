const { Command } = require('commander');

const manageCommand = new Command('manage')
    .description('Manage your project')
    .action(() => {
        console.log('Manage command executed');
    });

module.exports = manageCommand;

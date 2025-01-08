const { Command } = require('commander');

const manageCommand = new Command('manage')
    .description('Manage your project')
    .action(() => {
        console.log('Manage command coming soon!');
    });

module.exports = manageCommand;

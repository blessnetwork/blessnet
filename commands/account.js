const { Command } = require('commander');

const accountCommand = new Command('account');

accountCommand
    .description('Manage your account')
    .action(() => {
        console.log('Account management command executed');
    });

module.exports = accountCommand;

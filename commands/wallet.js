const { Command } = require('commander');
const createWalletCommand = require('./createWallet');
const listWalletsCommand = require('./listWallets');
const walletInfoCommand = require('./walletInfo');

const walletCommand = new Command('wallet').description('Manage Solana wallets').action((name) => {

});

// Add subcommands to the wallet command
walletCommand.addCommand(createWalletCommand);
// walletCommand.addCommand(listWalletsCommand);
// walletCommand.addCommand(walletInfoCommand);

module.exports = walletCommand;
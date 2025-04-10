const { Command } = require('commander');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { BLESSNET_DIR } = require('../lib/constants')
const readWallet = require('./walletUtils')

const walletInfoCommand = new Command('info').addArgument('name')
    .description('Get information about a specific Solana wallet')
    .action((name) => {
        const walletFile = path.join(BLESSNET_DIR, name, 'wallet.json');
        if (!fs.existsSync(walletFile)) {
            console.log(`The wallet "${name}" was not found.`);
            return;
        }

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        rl.question('Enter the encryption key: ', (encryptionKey) => {
            rl.close();

            if (!encryptionKey) {
                console.log('An encryption key is required.');
                return;
            }
            const keypair = readWallet(walletFile, encryptionKey)
            console.log(`The public key for wallet "${name}" is: ${keypair.publicKey.toBase58()}`);
        });
    });

module.exports = walletInfoCommand;
const { Command } = require('commander');
const { Keypair } = require('@solana/web3.js');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const readline = require('node:readline');
const chalk = require('chalk');
const { BLESSNET_DIR } = require('../lib/constants');

if (!fs.existsSync(BLESSNET_DIR)) {
    fs.mkdirSync(BLESSNET_DIR);
}

const createWalletCommand = new Command('create').addArgument('name')
    .description('Create a new Solana wallet')
    .action((name) => {
        if (!name) {
            name = `wallet-${crypto.randomBytes(4).toString('hex')}`;
            console.log(chalk.yellow(`No name provided. Generated random wallet name: ${name}`));
        }
        console.log(chalk.green('Creating a new Solana wallet...'));
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        const walletDir = path.join(BLESSNET_DIR, name);
        if (fs.existsSync(walletDir)) {
            rl.question(chalk.yellow(`Wallet ${name} already exists. Do you want to overwrite it? (yes/no): `), (answer) => {
                if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                    console.log(chalk.red('Wallet creation aborted.'));
                    rl.close();
                    return;
                }
                createWallet();
            });
        } else {
            createWallet();
        }

        function createWallet() {
            rl.question(chalk.green('Enter an encryption key: '), (encryptionKey) => {
                rl.close();

                if (!encryptionKey) {
                    console.log(chalk.red('Encryption key is required.'));
                    return;
                }

                console.log(chalk.yellow(`Creating a new Solana wallet named ${name}...`));

                // Create a new Solana wallet
                const keypair = Keypair.generate();
                const secretKey = JSON.stringify(Array.from(keypair.secretKey));

                // Encrypt the wallet
                const cipher = crypto.createCipheriv('aes-256-cbc', crypto.createHash('sha256').update(encryptionKey).digest(), Buffer.alloc(16, 0));
                let encrypted = cipher.update(secretKey, 'utf8', 'hex');
                encrypted += cipher.final('hex');

                // Save the encrypted wallet to a file
                if (!fs.existsSync(walletDir)) {
                    fs.mkdirSync(walletDir);
                }
                const walletFile = path.join(walletDir, 'wallet.json');
                const walletData = {
                    publicKey: keypair.publicKey.toBase58(),
                    encryptedSecretKey: encrypted
                };
                fs.writeFileSync(walletFile, JSON.stringify(walletData, null, 2));
                console.log(chalk.green(`Solana wallet "${name}" has been created and encrypted in ${walletFile}`));
            });
        }
    });

module.exports = createWalletCommand;
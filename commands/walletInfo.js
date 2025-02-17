const { Command } = require('commander');
const { Keypair } = require('@solana/web3.js');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const BLESSNET_DIR = path.join(os.homedir(), '.blessnet');

const walletInfoCommand = new Command('info').addArgument('name')
    .description('Get information about a specific Solana wallet')
    .action((name) => {
        const walletFile = path.join(BLESSNET_DIR, `${name}.json`);
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

            const encrypted = fs.readFileSync(walletFile, 'utf8');
            const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.createHash('sha256').update(encryptionKey).digest(), Buffer.alloc(16, 0));
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            const secretKey = JSON.parse(decrypted);
            const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
            console.log(`The public key for wallet "${name}" is: ${keypair.publicKey.toBase58()}`);
        });
    });

module.exports = walletInfoCommand;
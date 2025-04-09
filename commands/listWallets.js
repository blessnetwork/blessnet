const { Command } = require('commander');
const fs = require('node:fs');
const path = require('node:path');
const { BLESSNET_DIR } = require('../lib/constants')

const listWalletsCommand = new Command('list')
    .description('List all Solana wallets')
    .action(() => {
        const walletDirs = fs.readdirSync(BLESSNET_DIR).filter(dir => {
            const dirPath = path.join(BLESSNET_DIR, dir);
            return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, 'wallet.json'));
        });
        if (walletDirs.length === 0) {
            console.log('No wallets found');
        } else {
            console.log('Available wallets:');
            walletDirs.forEach(dir => {
                const walletFilePath = path.join(BLESSNET_DIR, dir, 'wallet.json');
                if (fs.existsSync(walletFilePath)) {
                    const walletData = JSON.parse(fs.readFileSync(walletFilePath, 'utf8'));
                    console.log(`  ${dir}: ${walletData.publicKey}`);
                } else {
                    console.log(`  ${dir}: wallet.json file not found`);
                }
            });
        }
    });

module.exports = listWalletsCommand;
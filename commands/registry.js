const { 
    Command, 
    Argument 
} = require('commander')
const anchor = require('@coral-xyz/anchor')
const { BLESSNET_DIR } = require('./const')
const path = require('node:path')
const fs = require('node:fs')
const process = require('node:process')
const chalk = require('chalk')
const readline = require('node:readline')
const readWallet = require('./walletUtils')

const blsClient = require('/Users/join/Works/bls-sol-stake/anchor/dist')
const { Keypair } = require('@solana/web3.js')

const registryCommand = new Command('registry')
    .description('registry: registry action bind the bless node with wallet')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

registryCommand
    .addArgument(walletArg)
    .option('--cluster <cluster>', 'solana cluster: mainnet, testnet, devnet, <custom>')
    .action((wallet, options) => {
        options.cluster = options.cluster || 'mainnet';
        const walletDir = path.join(BLESSNET_DIR, wallet);
        const walletFile = path.join(walletDir, 'wallet.json');
        if (!fs.existsSync(walletFile)) {
            console.info(`The wallet "${walletFile}" was not found,follow wallet exist`)
             const walletDirs = fs.readdirSync(BLESSNET_DIR).filter(dir => {
                const dirPath = path.join(BLESSNET_DIR, dir);
                return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, 'wallet.json'))
            })
            walletDirs.forEach(dir => {
                console.log(chalk.green(dir))
            })
            return;
        }
        const idFile = path.resolve(__dirname, "..", ".invalid.json")
        if (!fs.existsSync(idFile)) {
            const keypair = Keypair.generate()
            fs.writeFileSync(idFile, JSON.stringify(Array.from(keypair.secretKey)))
        }
        process.env['ANCHOR_PROVIDER_URL'] = "https://api.devnet.solana.com"
        process.env['ANCHOR_WALLET'] = idFile
        const client = new blsClient.BlsRegisterClient()
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        rl.question('Enter the encryption key: ', (encryptionKey) => {
            rl.close()
            if (!encryptionKey) {
                console.log(chalk.red('An encryption key is required.'));
                return;
            }
            const walletKeypair = readWallet(walletFile, encryptionKey)
            client.setWallet(new anchor.Wallet(walletKeypair))
        })
    })

module.exports = registryCommand
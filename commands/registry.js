const { 
    Command, 
    Argument 
} = require('commander')
const anchor = require('@coral-xyz/anchor')
const { BLESSNET_DIR, SOLANA_CLUSTERS } = require('./const')
const path = require('node:path')
const fs = require('node:fs')
const process = require('node:process')
const chalk = require('chalk')
const {LAMPORTS_PER_SOL} =  require('@solana/web3.js')
const readline = require('node:readline')
const readWallet = require('./walletUtils')

const blsClient = require('/Users/join/Works/bls-sol-stake/anchor/dist')
const { Keypair } = require('@solana/web3.js')

const registryCommand = new Command('registry')
    .description('registry: registry action bind the bless node with wallet')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

const getProvider = (cluster) => {
    let url = null;
    SOLANA_CLUSTERS.forEach((item) => {
        if (item.name === cluster) {
            url = item.url;
        }
    })
    return url||cluster
}

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
        const endpoint = getProvider(options.cluster)
        process.env['ANCHOR_PROVIDER_URL'] = endpoint
        process.env['ANCHOR_WALLET'] = idFile
        const client = new blsClient.BlsRegisterClient()
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        const stake = () => {
            const stakeRl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true
            });
            stakeRl.question('Enter the stake amount: ', async (amount) => {
                stakeRl.close()
                let amountNum = parseInt(amount)
                if (isNaN(amountNum)) {
                    console.log(chalk.red('The stake amount must be a number.'))
                    process.exit(1)
                }
                if (amountNum < 1) {
                    console.log(chalk.red('The stake amount must be great than 1.'))
                    process.exit(1)
                }
                const amBN = new anchor.BN(amount).mul(new anchor.BN(LAMPORTS_PER_SOL))
                const result = await client.registerClient.stake(amBN)
                console.log(chalk.green(`The stake transaction is: https://explorer.solana.com/transaction/${result}?cluster=custom&customUrl=${endpoint}`))
                
            })
        }

        rl.question('Enter the encryption key: ',async (encryptionKey) => {
            rl.close()
            if (!encryptionKey) {
                console.log(chalk.red('An encryption key is required.'));
                return;
            }
            const walletKeypair = readWallet(walletFile, encryptionKey)
            client.setWallet(new anchor.Wallet(walletKeypair))
            const balance = await client.getBalance(walletKeypair.publicKey)
            const balanceBN = new anchor.BN(balance).div(new anchor.BN(LAMPORTS_PER_SOL));
            console.log(chalk.green(`The wallet "${walletKeypair.publicKey}" balance is: ${balanceBN.toNumber()}`))
            if (balance <= 0) {
                console.log(chalk.red('The wallet balance is 0, please fund it first.'))
                process.exit(1)
            }
            stake()
            
        })
    })

module.exports = registryCommand
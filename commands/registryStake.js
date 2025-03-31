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
const { getProvider,base64ToArray } = require('./registryUtils')

const blsClient = require('bls-stake-cli')
const { Keypair } = require('@solana/web3.js')

const registryStakeCommand = new Command('stake')
    .option('--cluster <cluster>', 'solana cluster: mainnet, testnet, devnet, localnet, <custom>')
    .description('stake: registry stake action bind the bless node with wallet')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

registryStakeCommand
    .addArgument(walletArg)
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
        const provider = getProvider(options.cluster)
        process.env['ANCHOR_PROVIDER_URL'] = provider.endpoint
        process.env['ANCHOR_WALLET'] = idFile
        const client = new blsClient.BlsRegisterClient()
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });

        const stake = (nodeKey) => {
            rl.question('Enter the stake amount: ', async (amount) => {
                rl.close()
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
                const result = await client.registerClient.stake(nodeKey, amBN)
                let endpoint = `&customUrl=${provider.endpoint}`
                if (provider.cluster !== 'custom') {
                    endpoint = ''
                }
                console.log(chalk.green(`The stake transaction is: https://explorer.solana.com/transaction/${result}?cluster=${provider.cluster}${endpoint}`))
            })
        }

        rl.question('Enter the encryption key: ',async (encryptionKey) => {
            if (!encryptionKey) {
                console.log(chalk.red('An encryption key is required.'));
                return;
            }
            let walletKeypair
            
            try {
                walletKeypair = readWallet(walletFile, encryptionKey)
            } catch {
                console.log(chalk.red('The encryption key is invalid.'))
                process.exit(1)
            }
            client.setWallet(new anchor.Wallet(walletKeypair))
            const balance = await client.getBalance(walletKeypair.publicKey)
            const sol = balance / LAMPORTS_PER_SOL
            console.log(chalk.green(`The wallet "${walletKeypair.publicKey}" balance is: ${sol}`))
            if (sol <= 0) {
                console.log(chalk.red('The wallet balance is 0, please fund it first.'))
                process.exit(1)
            }
            rl.question('Enter the node key: ', (nodeKey) => {
                try {
                    nodeKeyArr = base64ToArray(nodeKey)
                } catch {
                    console.log(chalk.red('The node key is invalid.'))
                    process.exit(1)
                }
                if (nodeKey == null || nodeKeyArr.length !== 36 ) {
                    console.log(chalk.red('The node key is invalid.'))
                    process.exit(1)
                }
                stake(nodeKey)
            })
            
            
        })
    })

module.exports = registryStakeCommand
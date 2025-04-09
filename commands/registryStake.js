const { 
    Command, 
    Argument 
} = require('commander')
const anchor = require('@coral-xyz/anchor')
const { BLESSNET_DIR } = require('../lib/constants')
const path = require('node:path')
const process = require('node:process')
const chalk = require('chalk')
const {LAMPORTS_PER_SOL} =  require('@solana/web3.js')
const readline = require('node:readline')
const {readWallet} = require('./walletUtils')
const { 
    getProvider,
    base64ToArray,
    checkWallet, 
    printBalance 
} = require('./registryUtils')

const blsClient = require('bls-stake-cli')

const registryStakeCommand = new Command('stake')
    .option('--cluster <cluster>', 'solana cluster: mainnet, testnet, devnet, localnet, <custom>')
    .description('stake: registry stake action bind the bless node with wallet')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

registryStakeCommand
    .addArgument(walletArg)
    .action(async (wallet, options) => {
        options.cluster = options.cluster || 'mainnet';
        const walletDir = path.join(BLESSNET_DIR, wallet);
        const walletFile = path.join(walletDir, 'wallet.json');
        if (!checkWallet(walletFile)) {
            return
        }
       
        const provider = getProvider(options.cluster)
        process.env['ANCHOR_PROVIDER_URL'] = provider.endpoint
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
                await printBalance(client)
            })
        }

        rl.question('Enter the encryption key: ',async (encryptionKey) => {
            if (!encryptionKey) {
                console.log(chalk.red('An encryption key is required.'))
                process.exit(1)
            }
            let walletKeypair
            
            try {
                walletKeypair = readWallet(walletFile, encryptionKey)
            } catch {
                console.log(chalk.red('The encryption key is invalid.'))
                process.exit(1)
            }
            client.setWallet(new anchor.Wallet(walletKeypair))
            
            const pk = client.getWallet().publicKey
            const balance = await client.getBalance(pk)
            if (balance <= 0) {
                console.log(chalk.red('The wallet balance is 0, please fund it first.'))
                process.exit(1)
            }
            await printBalance(client)
            rl.question('Enter the node key: ', (nodeKey) => {
                let nodeKeyArr
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
const { 
    Command, 
    Argument 
} = require('commander')
const anchor = require('@coral-xyz/anchor')
const { BLESSNET_DIR } = require('./const')
const path = require('node:path')
const process = require('node:process')
const chalk = require('chalk')
const readline = require('node:readline')
const {readWallet} = require('./walletUtils')
const { getProvider,printBalance, checkWallet } = require('./registryUtils')

const blsClient = require('bls-stake-cli')

const registryDeactiveCommand = new Command('withdraw')
    .option('--cluster <cluster>', 'solana cluster: mainnet, testnet, devnet, localnet, <custom>')
    .description('withdraw: registry withdraw vault account balance to wallet')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

registryDeactiveCommand
    .addArgument(walletArg)
    .action((wallet, options) => {
        options.cluster = options.cluster || 'mainnet'
        const walletDir = path.join(BLESSNET_DIR, wallet)
        const walletFile = path.join(walletDir, 'wallet.json')
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

        const withdraw = async () => {
            const result = await client.registerClient.blsRegisterWithdraw()
            let endpoint = `&customUrl=${provider.endpoint}`
            if (provider.cluster !== 'custom') {
                endpoint = ''
            }
            console.log(chalk.green(`The stake transaction is: https://explorer.solana.com/transaction/${result}?cluster=${provider.cluster}${endpoint}`))
            await printBalance(client)
            process.exit(0)
        }

        rl.question('Enter the encryption key: ',async (encryptionKey) => {
            if (!encryptionKey) {
                console.log(chalk.red('An encryption key is required.'));
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
            await printBalance(client)
            await withdraw()
            
        })
    })

module.exports = registryDeactiveCommand
const { 
    Command, 
    Argument 
} = require('commander')
const anchor = require('@coral-xyz/anchor')
const { BLESSNET_DIR } = require('./const')
const path = require('node:path')
const process = require('node:process')
const {PublicKey} = require("@solana/web3.js");
const chalk = require('chalk')
const readline = require('node:readline')
const {readWalletJson} = require('./walletUtils')
const {
    getProvider, 
    dateFormat, 
    checkWallet, 
    formatSOL
} = require('./registryUtils')

const blsClient = require('bls-stake-cli')

const registryInfoCommand = new Command('info')
    .option('--cluster <cluster>', 'solana cluster: mainnet, testnet, devnet, localnet, <custom>')
    .description('info: show the  registry info')
const walletArg = new Argument('wallet', 'wallet name')
walletArg.required = true

registryInfoCommand
    .addArgument(walletArg)
    .action(async (wallet, options) => {
        options.cluster = options.cluster || 'mainnet'
        const walletDir = path.join(BLESSNET_DIR, wallet)
        const walletFile = path.join(walletDir, 'wallet.json')
        const walletJson = readWalletJson(walletFile)
        if (!checkWallet(walletFile)) {
            return
        }
        const pubkey = walletJson.publicKey
        const provider = getProvider(options.cluster)
        process.env['ANCHOR_PROVIDER_URL'] = provider.endpoint
        const client = new blsClient.BlsRegisterClient()
        let state = null
        const pubickkey = new PublicKey(pubkey)
        try {

            state = await client.registerClient.fetchRegisterStateWithWallet(pubickkey)  
        } catch(e) {
            if(e.message.indexOf('Account does not exist') >= 0) {
                state = null
            } else {
                throw e
            }
        }
        let totalStaked = formatSOL(state?.totalStaked||0)
        let totalDeactived = formatSOL(state?.totalDeactived||0)
        let totalWithdraw = formatSOL(state?.totalWithdraw||0)
        const tab = "\t"
        console.log(chalk.green(`totalStaked: ${totalStaked}${tab}totalDeactived: ${totalDeactived}${tab}totalDeactived: ${totalWithdraw}`))
        state?.records.forEach(e => {
            const amount = formatSOL(e.amount)
            const date = dateFormat(e.time)
            console.log(`amount: ${amount}${tab}time: ${date}${tab}status: ${e.state}`)
        });
        process.exit(0)
    })

module.exports = registryInfoCommand
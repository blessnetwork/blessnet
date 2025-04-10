const { 
    Command, 
    Argument 
} = require('commander')
const { BLESSNET_DIR } = require('../lib/constants')
const path = require('node:path')
const process = require('node:process')
const {PublicKey} = require("@solana/web3.js");
const chalk = require('chalk')
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
            process.exit(1)
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
        console.log(chalk.green(`totalStaked: ${totalStaked}${tab}totalDeactived: ${totalDeactived}${tab}totalWithdraw: ${totalWithdraw}`))
        const groups = {}
        state?.records.forEach(e => {
            const key = Buffer.from(e.nodeKey).toString('base64')
            let grp = groups[key]
            if(grp == null) {
                grp = []
                groups[key] = grp
            }
            grp.push(e)
        })

        for (const key in groups) {
            console.log(chalk.red(`node: ${key}`))
            groups[key].forEach(e => {
                const amount = formatSOL(e.amount)
                const date = dateFormat(e.time)
                if (e.state == "staked") {
                    console.log(chalk.green(`${tab}amount: ${amount}${tab}time: ${date}${tab}status: ${e.state}`))
                } else if (e.state == "withdrawed") {
                    console.log(chalk.gray(`${tab}amount: ${amount}${tab}time: ${date}${tab}status: ${e.state}`))
                } else {
                    console.log(`${tab}amount: ${amount}${tab}time: ${date}${tab}status: ${e.state}`)
                }
            });
        }
        
        
        process.exit(0)
    })

module.exports = registryInfoCommand
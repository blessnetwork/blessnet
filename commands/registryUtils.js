const { 
    SOLANA_CLUSTERS, 
    BLESSNET_DIR 
} = require('../lib/constants')
const anchor = require('@coral-xyz/anchor')
const fs = require('node:fs')
const path = require('node:path')
const chalk = require('chalk')
const process = require('node:process')
const {LAMPORTS_PER_SOL} =  require('@solana/web3.js')

const getProvider = (input) => {
    let url = input;
    let cluster = "custom"
    let matched = false
    SOLANA_CLUSTERS.forEach((item) => {
        if (item.name === input) {
            url = item.url
            matched = true
            cluster = item.cluster
        }
    })
    return {
        cluster,
        endpoint: url
    }
}

function base64ToArray(base64) {
    if (base64 === null || base64 === '') {
        return null
    }
    const binaryString = Buffer.from(base64, "base64").toString("binary")
    const bytes = new Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function dateFormat(d) {
    d = new Date(d.getTime() - 3000000);
    var date_format_str = d.getFullYear().toString()+"-"+((d.getMonth()+1).toString().length==2?(d.getMonth()+1).toString():"0"+(d.getMonth()+1).toString())+"-"+(d.getDate().toString().length==2?d.getDate().toString():"0"+d.getDate().toString())+" "+(d.getHours().toString().length==2?d.getHours().toString():"0"+d.getHours().toString())+":"+((parseInt(d.getMinutes()/5)*5).toString().length==2?(parseInt(d.getMinutes()/5)*5).toString():"0"+(parseInt(d.getMinutes()/5)*5).toString())+":00";
    return date_format_str
}

function checkWallet(walletFile) {
    const idFile = path.resolve(__dirname, "..", ".invalid.json")
    
    if (!fs.existsSync(idFile)) {
        const keypair = Keypair.generate()
        fs.writeFileSync(idFile, JSON.stringify(Array.from(keypair.secretKey)))
    }
    process.env['ANCHOR_WALLET'] = idFile
    if (!fs.existsSync(walletFile)) {
        console.info(`The wallet "${walletFile}" was not found,follow wallet exist`)  
        const walletDirs = fs.readdirSync(BLESSNET_DIR).filter(dir => {
            const dirPath = path.join(BLESSNET_DIR, dir);
            return fs.statSync(dirPath).isDirectory() && fs.existsSync(path.join(dirPath, 'wallet.json'))
        })  
        walletDirs.forEach(dir => {
            console.log(chalk.green(dir))
        })
        return false
    }
    return true
}

const formatSOL = (lamport) => {
    if (typeof lamport == anchor.BN) {
        lamport = lamport.toNumber()
    }
    return lamport/LAMPORTS_PER_SOL
}

const printBalance = async (client) => {
    const pk = client.getWallet().publicKey
    const balance = await client.getBalance(pk)
    const sol = formatSOL(balance)
    console.log(chalk.green(`The wallet "${pk}" balance is: ${sol}`))
}

module.exports = {
    dateFormat,
    checkWallet,
    getProvider,
    base64ToArray,
    printBalance,
    formatSOL
}
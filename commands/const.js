const os = require('node:os')
const path = require('node:path')

const BLESNET_HOME = '.blessnet'

const BLESSNET_DIR = path.join(os.homedir(), BLESNET_HOME)

const SOLANA_CLUSTERS = [{
    name: 'mainnet',
    url: 'https://api.mainnet-beta.solana.com'
}, {
    name: 'testnet',
    url: 'https://api.testnet.solana.com'
}, {
    name: 'devnet',
    url: 'https://api.devnet.solana.com'
}, {
    name: 'localnet',
    url: 'http://localhost:8899'
}]

module.exports = {
    BLESNET_HOME,
    BLESSNET_DIR,
    SOLANA_CLUSTERS
}


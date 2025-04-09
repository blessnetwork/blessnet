const os = require('node:os')
const path = require('node:path')

const BLESNET_HOME = '.blessnet'

const BLESSNET_DIR = path.join(os.homedir(), BLESNET_HOME)

const SOLANA_CLUSTERS = [{
    name: 'mainnet',
    url: 'https://api.mainnet-beta.solana.com',
    cluster: 'mainnet-beta',
}, {
    name: 'testnet',
    url: 'https://api.testnet.solana.com',
    cluster: 'testnet',
}, {
    name: 'devnet',
    url: 'https://api.devnet.solana.com'
}, {
    name: 'localnet',
    url: 'http://localhost:8899',
    cluster: 'custom',

}]

const CONSTANTS = {
    blessAuthClientId: '4f70928c9b0f88b54ee3b940019ec1bd',
    BLESNET_HOME,
    BLESSNET_DIR,
    SOLANA_CLUSTERS,
    authHost: 'https://auth.bless.network' // Add this line
}



module.exports = CONSTANTS;
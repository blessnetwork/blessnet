const os = require('node:os')
const path = require('node:path')

const BLESNET_HOME = '.blessnet'

const BLESSNET_DIR = path.join(os.homedir(), BLESNET_HOME)

module.exports = {
    BLESNET_HOME,
    BLESSNET_DIR
}
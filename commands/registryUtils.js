const { SOLANA_CLUSTERS } = require('./const')
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
    const binaryString = atob(base64)
    const bytes = new Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

module.exports = {
    getProvider,
    base64ToArray
}
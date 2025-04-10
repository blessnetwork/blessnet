const fs = require('node:fs');
const crypto = require('node:crypto');
const { Keypair } = require('@solana/web3.js');

const readWalletJson = (walletFile) => {
    const content = fs.readFileSync(walletFile, 'utf8')
    const walletJson = JSON.parse(content)
    return walletJson
}

const readWallet = (walletFile, encryptionKey) => {
    const walletJson = readWalletJson(walletFile)
    const encrypted = walletJson.encryptedSecretKey;
    const encryptionKeyDigest = crypto.createHash('sha256').update(encryptionKey).digest()
    const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKeyDigest, Buffer.alloc(16, 0));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    const secretKey = JSON.parse(decrypted);
    const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));
    return keypair
}

module.exports = {
    readWallet,
    readWalletJson,
}
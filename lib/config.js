const fs = require('node:fs');
const { stringify, parse } = require('@iarna/toml');


/**
 * Helper function to parse a BLS config file
 * 
 * @param filePath 
 * @param fileName 
 * @returns 
 */
function parseBlsConfig(filePath = './', fileName = 'bls.toml') {
    return parseTomlConfig(filePath, fileName);
}

/**
 * Helper function to save BLS config
 * 
 * @param filePath 
 * @param fileName 
 * @returns 
 */
function saveBlsConfig(json, filePath = './', fileName = 'bls.toml') {
    try {
        saveTomlConfig(json, filePath, fileName);
    } catch (error) {
        throw new Error(`Unable to save bls.toml, ${error.message}.`);
    }
}

/**
 * Helper function to parse a TOML config file
 * 
 * @param filePath 
 * @param fileName 
 * @returns 
 */
function parseTomlConfig(filePath, fileName) {
    try {
        const configPath = `${filePath}/${fileName}`;
        return parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (error) {
        throw new Error('Project or bls.toml not detected, run `bls init` to create a project.');
    }
}

/**
 * Helper function to stringify and save a TOML file
 * 
 * @param json 
 * @param filePath 
 * @param fileName 
 * @returns 
 */
function saveTomlConfig(json, filePath, fileName) {
    const configData = stringify(json);
    const configPath = `${filePath}/${fileName}`;
    return fs.writeFileSync(configPath, configData, { flag: "w" });
}

/**
 * Updates the node count in the BLS config
 * @param {string} nodeCount - Can be '1', '3', or 'all'
 * @param {string} filePath - Path to config directory
 * @param {string} fileName - Config filename
 */
function updateNodeCount(nodeCount, filePath = './', fileName = 'bls.toml') {
    if (!['1', '3', 'all'].includes(nodeCount)) {
        throw new Error('Invalid node count. Must be "1", "3", or "all"');
    }

    try {
        const config = parseBlsConfig(filePath, fileName);
        if (!config.deployment) {
            config.deployment = {};
        }
        config.deployment.nodes = nodeCount === 'all' ? -1 : parseInt(nodeCount);
        saveBlsConfig(config, filePath, fileName);
    } catch (error) {
        throw new Error(`Failed to update node count: ${error.message}`);
    }
}

module.exports = {
    parseBlsConfig,
    saveBlsConfig,
    parseTomlConfig,
    updateNodeCount
};

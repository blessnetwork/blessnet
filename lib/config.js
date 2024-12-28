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

module.exports = {
    parseBlsConfig,
    saveBlsConfig,
    parseTomlConfig // Export parseTomlConfig
};

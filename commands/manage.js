const { Command } = require('commander');
const { parseBlsConfig, saveBlsConfig } = require('../lib/config');
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const path = require('path');

const manageCommand = new Command('manage')
    .description('Manage your project')
    .action(() => {
        const cwd = process.cwd();
        const config = parseBlsConfig(cwd);
        console.log(`Current Return Type is ${config.type}`);

        const answer = readlineSync.question(chalk.yellow('Would you like to change anything about the project? (yes/no): '));
        if (['yes', 'y'].includes(answer.toLowerCase())) {
            const changeType = readlineSync.question(chalk.yellow('Would you like to change the project return type? (yes/no): '));
            if (['yes', 'y'].includes(changeType.toLowerCase())) {
                const types = ['text', 'json', 'html', 'raw'];
                const index = readlineSync.keyInSelect(types, chalk.yellow('Select the new project type:'));
                if (index !== -1) {
                    config.type = types[index];
                    saveBlsConfig(config, cwd);
                    console.log(chalk.green('Project type updated successfully.'));
                } else {
                    console.log('No changes will be made to the return type.\n');
                }
            } else {
                console.log('No changes will be made to the project type.');
            }
        } else {
            console.log('No changes will be made.');
        }
    });

module.exports = manageCommand;

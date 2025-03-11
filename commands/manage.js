const { Command } = require('commander');
const { parseBlsConfig, saveBlsConfig, updateNodeCount } = require('../lib/config');
const readlineSync = require('readline-sync');
const chalk = require('chalk');
const path = require('node:path');

const manageCommand = new Command('manage')
    .description('Manage your project');

manageCommand
    .command('type [newType]')
    .description('Change the project return type')
    .action((newType) => {
        const cwd = process.cwd();
        const config = parseBlsConfig(cwd);
        const types = ['text', 'json', 'html', 'raw'];
        let selectedType;

        if (!newType || !types.includes(newType)) {
            const index = readlineSync.keyInSelect(types, chalk.yellow('Select the new project type:'));
            if (index !== -1) {
                selectedType = types[index];
            } else {
                console.log('No changes were made to the return type.\n');
                return;
            }
        }

        config.type = newType || selectedType;
        saveBlsConfig(config, cwd);
        console.log(chalk.green('Project type has been updated successfully.'));
    });

manageCommand
    .command('env [newEnv]')
    .description('Change the deployment environment (production/development)')
    .action((newEnv) => {
        const cwd = process.cwd();
        const config = parseBlsConfig(cwd);
        const environments = ['production', 'development'];
        let selectedEnv;

        if (!newEnv || !environments.includes(newEnv.toLowerCase())) {
            const index = readlineSync.keyInSelect(environments, chalk.yellow('Select the deployment environment:'));
            if (index !== -1) {
                selectedEnv = environments[index];
            } else {
                console.log('No changes were made to the environment.\n');
                return;
            }
        }

        config.environment = (newEnv || selectedEnv).toLowerCase();
        saveBlsConfig(config, cwd);
        console.log(chalk.green(`Deployment environment has been set to ${config.environment}.`));
    });

manageCommand
    .command('nodes [count]')
    .description('Change the number of nodes to execute (1, 3, or all)')
    .action((count) => {
        const cwd = process.cwd();
        const nodeCounts = ['1', '3', 'all'];
        let selectedCount;

        if (!count || !nodeCounts.includes(count)) {
            const index = readlineSync.keyInSelect(nodeCounts, chalk.yellow('Select the number of nodes to execute:'));
            if (index !== -1) {
                selectedCount = nodeCounts[index];
            } else {
                console.log('No changes were made to the node count.\n');
                return;
            }
        }

        try {
            updateNodeCount(count || selectedCount, cwd);
            console.log(chalk.green(`Node count has been set to ${count || selectedCount}.`));
        } catch (error) {
            console.error(chalk.red(error.message));
        }
    });

manageCommand
    .action(() => {
        const cwd = process.cwd();
        const config = parseBlsConfig(cwd);
        console.log(`Current return type is: ${config.type}`);
        console.log(`Current environment is: ${config.environment || 'production'}`);
        console.log(`Current node count is: ${config.deployment?.nodes === -1 ? 'all' : config.deployment?.nodes || 1}`);

        const answer = readlineSync.question(chalk.yellow('Would you like to change anything about the project? (yes/no): '));
        if (['yes', 'y'].includes(answer.toLowerCase())) {
            const changeType = readlineSync.question(chalk.yellow('Would you like to change the project return type? (yes/no): '));
            if (['yes', 'y'].includes(changeType.toLowerCase())) {
                const types = ['text', 'json', 'html', 'raw'];
                const index = readlineSync.keyInSelect(types, chalk.yellow('Select the new project type:'));
                if (index !== -1) {
                    config.type = types[index];
                    saveBlsConfig(config, cwd);
                    console.log(chalk.green('Project type has been updated successfully.'));
                } else {
                    console.log('No changes were made to the return type.\n');
                }
            } else {
                console.log('No changes were made to the project type.');
            }

            const changeEnv = readlineSync.question(chalk.yellow('Would you like to change the deployment environment? (yes/no): '));
            if (['yes', 'y'].includes(changeEnv.toLowerCase())) {
                const environments = ['production', 'development'];
                const index = readlineSync.keyInSelect(environments, chalk.yellow('Select the deployment environment:'));
                if (index !== -1) {
                    config.environment = environments[index];
                    saveBlsConfig(config, cwd);
                    console.log(chalk.green(`Deployment environment has been set to ${config.environment}.`));
                } else {
                    console.log('No changes were made to the environment.\n');
                }
            }

            const changeNodes = readlineSync.question(chalk.yellow('Would you like to change the number of nodes? (yes/no): '));
            if (['yes', 'y'].includes(changeNodes.toLowerCase())) {
                const nodeCounts = ['1', '3', 'all'];
                const index = readlineSync.keyInSelect(nodeCounts, chalk.yellow('Select the number of nodes to execute:'));
                if (index !== -1) {
                    try {
                        updateNodeCount(nodeCounts[index], cwd);
                        console.log(chalk.green(`Node count has been set to ${nodeCounts[index]}.`));
                    } catch (error) {
                        console.error(chalk.red(error.message));
                    }
                } else {
                    console.log('No changes were made to the node count.\n');
                }
            }
        } else {
            console.log('No changes were made.');
        }
    });

module.exports = manageCommand;

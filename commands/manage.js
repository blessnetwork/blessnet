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
    .command('permissions [action] [url]')
    .description('Manage allowed URLs (list, add, remove)')
    .action((action, url) => {
        const cwd = process.cwd();
        const config = parseBlsConfig(cwd);

        // Initialize deployment and permissions array if they don't exist
        if (!config.deployment) {
            config.deployment = {};
        }
        if (!config.deployment.permissions) {
            config.deployment.permissions = [];
        }

        // Handle actions
        switch (action) {
            case 'list':
                console.log(chalk.yellow('Allowed URLs:'));
                if (config.deployment.permissions.length === 0) {
                    console.log('No URLs configured.');
                } else {
                    config.deployment.permissions.forEach((url, index) => {
                        console.log(`${index + 1}. ${url}`);
                    });
                }
                break;

            case 'add':
                if (!url) {
                    url = readlineSync.question(chalk.yellow('Enter the URL to allow (must start with https://): '));
                }

                if (!url.startsWith('https://')) {
                    console.error(chalk.red('URL must start with https://'));
                    return;
                }

                if (config.deployment.permissions.includes(url)) {
                    console.log(chalk.yellow(`URL ${url} is already allowed.`));
                    return;
                }

                config.deployment.permissions.push(url);
                saveBlsConfig(config, cwd);
                console.log(chalk.green(`Added ${url} to allowed URLs.`));
                break;

            case 'remove':
                if (!url) {
                    // If no URL is provided, show a list and ask which one to remove
                    if (config.deployment.permissions.length === 0) {
                        console.log(chalk.yellow('No URLs configured to remove.'));
                        return;
                    }

                    console.log(chalk.yellow('Select URL to remove:'));
                    const index = readlineSync.keyInSelect(
                        config.deployment.permissions,
                        chalk.yellow('Which URL do you want to remove?')
                    );

                    if (index === -1) {
                        console.log('No URL was removed.');
                        return;
                    }

                    const removedUrl = config.deployment.permissions.splice(index, 1)[0];
                    saveBlsConfig(config, cwd);
                    console.log(chalk.green(`Removed ${removedUrl} from allowed URLs.`));
                } else {
                    // Remove the specified URL
                    const initialLength = config.deployment.permissions.length;
                    config.deployment.permissions = config.deployment.permissions.filter(p => p !== url);

                    if (config.deployment.permissions.length < initialLength) {
                        saveBlsConfig(config, cwd);
                        console.log(chalk.green(`Removed ${url} from allowed URLs.`));
                    } else {
                        console.log(chalk.yellow(`URL ${url} was not found in the allowed list.`));
                    }
                }
                break;

            default:
                // If no action is provided or an invalid action, show usage
                console.log(chalk.yellow('Usage: bls manage permissions [action] [url]'));
                console.log('Actions:');
                console.log('  list - Show all allowed URLs');
                console.log('  add <url> - Add a URL to the allowed list');
                console.log('  remove <url> - Remove a URL from the allowed list');
                break;
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

            const changePermissions = readlineSync.question(chalk.yellow('Would you like to manage URL permissions? (yes/no): '));
            if (['yes', 'y'].includes(changePermissions.toLowerCase())) {
                // Initialize deployment and permissions array if they don't exist
                if (!config.deployment) {
                    config.deployment = {};
                }
                if (!config.deployment.permissions) {
                    config.deployment.permissions = [];
                }

                // Show current permissions
                console.log(chalk.yellow('\nCurrent allowed URLs:'));
                if (config.deployment.permissions.length === 0) {
                    console.log('No URLs configured.');
                } else {
                    config.deployment.permissions.forEach((url, index) => {
                        console.log(`${index + 1}. ${url}`);
                    });
                }

                // Ask what action to take
                const actions = ['List URLs', 'Add a URL', 'Remove a URL'];
                const actionIndex = readlineSync.keyInSelect(
                    actions,
                    chalk.yellow('What would you like to do?')
                );

                if (actionIndex === -1) {
                    console.log('No changes were made to permissions.\n');
                    return;
                }

                switch (actionIndex) {
                    case 0: // List URLs - already displayed above
                        break;

                    case 1: // Add a URL
                        const urlToAdd = readlineSync.question(chalk.yellow('Enter the URL to allow (must start with https://): '));

                        if (!urlToAdd.startsWith('https://')) {
                            console.error(chalk.red('URL must start with https://'));
                            break;
                        }

                        if (config.deployment.permissions.includes(urlToAdd)) {
                            console.log(chalk.yellow(`URL ${urlToAdd} is already allowed.`));
                            break;
                        }

                        config.deployment.permissions.push(urlToAdd);
                        saveBlsConfig(config, cwd);
                        console.log(chalk.green(`Added ${urlToAdd} to allowed URLs.`));
                        break;

                    case 2: // Remove a URL
                        if (config.deployment.permissions.length === 0) {
                            console.log(chalk.yellow('No URLs configured to remove.'));
                            break;
                        }

                        const removeIndex = readlineSync.keyInSelect(
                            config.deployment.permissions,
                            chalk.yellow('Which URL do you want to remove?')
                        );

                        if (removeIndex === -1) {
                            console.log('No URL was removed.');
                            break;
                        }

                        const removedUrl = config.deployment.permissions.splice(removeIndex, 1)[0];
                        saveBlsConfig(config, cwd);
                        console.log(chalk.green(`Removed ${removedUrl} from allowed URLs.`));
                        break;
                }
            }
        } else {
            console.log('No changes were made.');
        }
    });

module.exports = manageCommand;

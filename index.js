#!/usr/bin/env node

// Import the custom console logger
require('./lib/console');

const { Command } = require('commander');
const program = new Command();
const packageJson = require('./package.json');

const fs = require('node:fs');
const path = require('node:path');
const { getRuntime } = require('./lib/bins');
const chalk = require('chalk');
const readlineSync = require('readline-sync')
const { parseTomlConfig } = require('./lib/config'); // Import parseTomlConfig

// checks
const isLinked = require('node:fs').existsSync(require('node:path').join(__dirname, 'node_modules', '.bin'));
const version = isLinked ? `${packageJson.version}-dev` : packageJson.version;
const blessnetDir = path.join(require('node:os').homedir(), '.blessnet');
const runtimePath = path.join(blessnetDir, 'bin', 'bls-runtime');
const authTokenPath = path.join(blessnetDir, 'auth_token');
const isLoggedIn = fs.existsSync(authTokenPath);

// commands
const initCommand = require('./commands/init');
const walletCommand = require('./commands/wallet');
const buildCommand = require('./commands/build');
const previewCommand = require('./commands/preview');
const manageCommand = require('./commands/manage');
const deployCommand = require('./commands/deploy');
const accountCommand = require('./commands/account'); // Import the account command
const Box = require("cli-box");

async function main() {

    const cwd = process.cwd();
    const blsTomlPath = path.join(cwd, 'bls.toml');

    const isVersionCommand = process.argv.includes('version') || process.argv.includes('-v');
    const isOptionsCommand = process.argv.includes('options');
    const isBuildCommand = process.argv.includes('build');
    const isInitCommand = process.argv.includes('init');
    const isHelpCommand = process.argv.includes('help') || process.argv.includes('-h') || process.argv.includes('--help');
    const isPreviewCommand = process.argv.includes('preview');
    const isManageCommand = process.argv.includes('manage');
    const isDeployCommand = process.argv.includes('deploy');

    if (!isVersionCommand && !isOptionsCommand && !isBuildCommand && !fs.existsSync(runtimePath)) {

        const answer = readlineSync.question(chalk.yellow("BLESS environment not found. Do you want to install it? (yes/no): "));

        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
            process.exit(1);
        }

        const install = async () => {
            await getRuntime().catch(err => {
                console.error('Failed to download bls-runtime:', err);
                process.exit(1);
            });

            console.log('BLESS environment installed successfully.');
            console.log('You can now use the `blessnet` command.');
            process.exit(0);
        }

        await install();
    }

    if (!isVersionCommand && !isOptionsCommand && !isBuildCommand && fs.existsSync(blsTomlPath)) {
        if (!isHelpCommand && !isPreviewCommand && !isManageCommand && !isDeployCommand) {
            const blsToml = parseTomlConfig(cwd, 'bls.toml'); // Use parseTomlConfig

            const info = [{
                "Project Name": blsToml.name,
                "Version": blsToml.version,
                "Type": blsToml.type,
            }];

            console.table(info);

            if (blsToml.deployments && blsToml.deployments.length > 0) {
                const deployment = blsToml.deployments[0];
                const createdDate = new Date(deployment.created).toLocaleString();
                console.log(chalk.yellow(`Deployment Status: ${chalk.green("Deployed")}`));
                console.log(chalk.yellow(`CID: ${deployment.cid}`));
                console.log(`${chalk.yellow("Created:")}  ${createdDate}\n`);
                if (deployment.host) {
                    console.log(`${chalk.yellow("Web2 Host:")} https://${deployment.host}\n`);
                }
            } else {
                console.log(chalk.yellow("Deployment Status: Not Deployed\n"));
            }

            console.log("Deploy this project to the BLESS network using the command:");
            console.log(chalk.green("blessnet deploy\n"));

            console.log("Preview this project using the command:");
            console.log(chalk.green("blessnet preview\n"));

            console.log("Change the project settings using the command:");
            console.log(chalk.green("blessnet manage\n"));

            console.log("Need more help?:");
            console.log(chalk.green("blessnet help\n"));

            console.log(`\nvisit ${chalk.blue('https://docs.bless.network')} for more information.\nyou are currently ${isLoggedIn ? chalk.green('logged in') : chalk.red('logged out')} to ${chalk.yellow('bless.network')}
            ${!isLoggedIn ? `\nTo login, run ${chalk.blue('npx blessnet options account login')}` : ''}`);
            console.log('npx blessnet options account logout\n');
            process.exit(0);
        }
    } else {
        if (!isVersionCommand && !isInitCommand && !isHelpCommand && !isOptionsCommand && !isBuildCommand) {
            const answer = readlineSync.question(`Run ${chalk.blue("blessnet help")} for more information.\n\n${chalk.red("No bls.toml file detected in the current directory.")}\n${chalk.yellow("Initialize project? (yes/no): ")}`);

            if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                process.exit(1);
            }

            await initCommand.parseAsync(['node', 'init']);
        } else if (isBuildCommand) {
            buildCommand.parseAsync(['node', 'build']);
            process.exit(0);
        } else if (isVersionCommand) {
            console.log(`Current version: ${packageJson.version}`);
            process.exit(0);
        }
    }

    // Set custom marks
    const b2 = new Box({
        w: process.stdout.columns
        , h: 12
        , stretch: true
        , stringify: false
    }, `
${chalk.yellow("To scaffold a new project, run:")}
    npx blessnet init <project-name>

${chalk.yellow("If you already have a project set up and would \nlike to add, remove, or update its structure, run:")}
    npx blessnet manage

${chalk.yellow("Preview your project results in the terminal or web:")}
    npx blessnet preview ${chalk.yellow("[serve]")}
`);

    program.addHelpText(
        'before',
        b2.stringify(),
    );

    program.addHelpText(
        'after',
        `\nvisit ${chalk.blue('https://docs.bless.network')} for more information.
you are currently ${isLoggedIn ? chalk.green('logged in') : chalk.red('logged out')} to ${chalk.yellow('bless.network')} \n
${!isLoggedIn ? `\nTo login, run ${chalk.blue('npx blessnet options account login')}\n` : ''}
\n`,
    );

    program
        .name(packageJson.name)
        .description(packageJson.description)
        .version(version);

    // Register commands
    if (fs.existsSync(blsTomlPath) || isInitCommand || isHelpCommand || isOptionsCommand) {
        program.addCommand(initCommand);
    }
    program.addCommand(previewCommand);
    program.addCommand(manageCommand);
    program.addCommand(deployCommand);

    // Create 'options' command and add 'wallet', 'account', and 'build' as subcommands
    const optionsCommand = new Command('options');
    optionsCommand.addCommand(walletCommand);
    optionsCommand.addCommand(accountCommand);
    optionsCommand.addCommand(buildCommand); // Move the build command under options
    program.addCommand(optionsCommand);

    program
        .command('version')
        .description('Show the current version')
        .action(() => {
            console.log(`Current version: ${packageJson.version}`);
        });

    await program.parseAsync(process.argv);
}

main()
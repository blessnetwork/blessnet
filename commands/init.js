const { Command } = require('commander');
const { downloadRepository } = require('../lib/git');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { slugify } = require('../lib/strings');
const readlineSync = require('readline-sync')
const chalk = require('chalk');

const checkGitInstalled = () => {
    try {
        execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
        console.error(chalk.red('Error: git is not installed or not found in PATH.'));
        process.exit(1);
    }
};

const getOra = async () => {
    const { default: ora } = await import('ora');
    return ora;
};

const initCommand = new Command('init')
    .argument('[name]', 'name of the project')
    .description('Initialize a new project')
    .action(async (projectNameArg) => {
        checkGitInstalled(); // Check if git is installed

        let projectName = projectNameArg;
        // If the argument equals "init" or is empty, prompt the user.
        if (!projectName || projectName === 'init' || projectName.trim() === '') {
            projectName = readlineSync.question('Enter a name for the project: ');
            while (!projectName || projectName.trim() === '') {
                console.log(chalk.yellow('Project name cannot be empty.'));
                projectName = readlineSync.question('Enter a name for the project: ');
            }
        }

        const installationPath = path.join(process.cwd(), projectName);
        const sanitizedName = slugify(projectName);
        const functionId = `bless-function_${sanitizedName}-1.0.0`;
        const ora = await getOra();

        console.log("");
        const initSpinner = ora(`${chalk.green("initializing")} a new project at ${installationPath}...`).start();
        try {
            await downloadRepository({
                repoUrl: "https://github.com/blessnetwork/template-javy-typescript-hello-world.git",
                destination: installationPath
            });

            initSpinner.text = "initializing dependencies...";

            execSync(`cd ${installationPath} && npm pkg set name=${sanitizedName}`);
            execSync(`cd ${installationPath} && npm pkg set bls.functionId=${functionId}`);
            execSync(`cd ${installationPath} && npm install`, { stdio: 'ignore' });

            initSpinner.succeed('Project initialized successfully.');
            console.log('');
            console.log(`Run 'cd ${projectName}' and 'blessnet' to get started.`);
            console.log('');
        } catch (error) {
            initSpinner.fail('Failed to initialize project.');
            console.error(error.message);
        }
    });

module.exports = initCommand;
const { Command } = require('commander');
const { downloadRepository } = require('../lib/git');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { slugify } = require('../lib/strings');
const readlineSync = require('readline-sync')
const chalk = require('chalk');

const getOra = async () => {
    const { default: ora } = await import('ora');
    return ora;
};

const initCommand = new Command('init')
    .argument('[name]', 'name of the project',)
    .description('Initialize a new project')
    .action(async (name) => {

        const projectName = name || readlineSync.question('Enter a name for the project: ');
        const installationPath = path.join(process.cwd(), projectName);
        const sanitizedName = slugify(projectName)
        const functionId = `bless-function_${sanitizedName}-1.0.0`;
        const ora = await getOra();

        console.log("");
        const initSpinner = ora(`${chalk.green("initializing")} a new project at ${installationPath}...`).start()
        try {
            await downloadRepository({
                repoUrl: "https://github.com/blocklessnetwork/template-javy-typescript-hello-world.git",
                destination: installationPath
            });


            initSpinner.text = "initializing dependencies..."

            execSync(`cd ${installationPath}; npm pkg set name=${sanitizedName}`)
            execSync(`cd ${installationPath}; npm pkg set bls.functionId=${functionId}`)
            execSync(`cd ${installationPath}; npm install`, { stdio: 'ignore' })


            initSpinner.succeed('project initialized successful.')
            console.log('');
            console.log(`cd ${projectName} and run blessnet to get started.`);
            console.log('');
        } catch (error) {
            console.error(error.message);
        }
    });

module.exports = initCommand;
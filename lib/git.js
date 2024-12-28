const { exec } = require('node:child_process');
const fs = require('fs');
const path = require('path');
const git = require('simple-git');
const chalk = require('chalk');

async function hasGit() {
    try {
        await exec('git --version');
        return true;
    } catch {
        return false;
    }
}

async function validateGitOrAbort() {
    if (!(await hasGit())) {
        console.log('Git not present');
    }
}

async function cleanGitRepository(destination = '.') {
    try {
        await exec(`cd ${destination}; rm -rf .git`);
        await exec(`cd ${destination}; rm -rf .github`);
        await exec(`cd ${destination}; rm -rf manifest.json`);

        return true;
    } catch (error) {
        return false;
    }
}

async function downloadRepository({
    repoUrl,
    destination,
    shallow,
}) {
    await validateGitOrAbort();

    if (fs.existsSync(destination) && fs.readdirSync(destination).length > 0) {
        console.log(chalk.red(`Destination path '${destination}' already exists and is not an empty directory.`));
        process.exit(1);
    }

    const [repository, branch] = repoUrl.split('#');
    const options = { '--recurse-submodules': null };

    if (branch) {
        options['--branch'] = branch;
    }

    if (shallow) {
        options['--depth'] = 1;
    }
    await git().clone(repository, destination, options);
    await cleanGitRepository(destination);
}

module.exports = {
    hasGit,
    validateGitOrAbort,
    cleanGitRepository,
    downloadRepository
};
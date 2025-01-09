const { Command } = require('commander');
const { createWasmManifest } = require('../lib/manifest');
const { createWasmArchive, submitWasmArchive } = require('../lib/archive');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const { parseBlsConfig } = require('../lib/config');
const toml = require('@iarna/toml');
const chalk = require('chalk');

const getFetch = async () => {
    const fetch = await import('node-fetch');
    return fetch.default;
};

const getOra = async () => {
    const { default: ora } = await import('ora');
    return ora;
};

const deployCommand = new Command('deploy')
    .description('Deploy your project')
    .action(async () => {
        const ora = await getOra();
        const fetch = await getFetch();
        const deploySpinner = ora('Deploying project ...').start()

        // Load configuration
        const config = parseBlsConfig(process.cwd());

        // Check if release build exists
        const releasePath = path.join(process.cwd(), config.build_release.dir, "release.wasm");
        if (!fs.existsSync(releasePath)) {
            deploySpinner.text = "Building release ...";
            execSync(config.build_release.command, { stdio: 'inherit' });
        }

        // Rename release.wasm to the package.json name
        const packageJson = require('../package.json');
        const wasmName = `${packageJson.name}.wasm`;
        const renamedWasmPath = path.join(process.cwd(), config.build_release.dir, wasmName);
        fs.renameSync(releasePath, renamedWasmPath);

        // Generate manifest.json
        const manifest = createWasmManifest(wasmName, 'application/javascript');
        const manifestPath = path.join(process.cwd(), config.build_release.dir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        // Create archive of manifest.json and the renamed wasm file
        const archiveName = `${packageJson.name}.tar.gz`;
        const archivePath = path.join(process.cwd(), config.build_release.dir, archiveName);
        const archiveBuffer = await createWasmArchive(path.join(process.cwd(), config.build_release.dir), archiveName, wasmName);

        deploySpinner.text = 'Publishing Archive Created ...'
        // Update manifest with new values
        const wasmMd5 = crypto.createHash('md5').update(fs.readFileSync(renamedWasmPath)).digest('hex');
        const archiveChecksum = crypto.createHash('sha256').update(fs.readFileSync(archivePath)).digest('hex');
        manifest.modules = [{
            file: wasmName,
            name: packageJson.name,
            type: 'entry',
            md5: wasmMd5
        }];
        manifest.runtime = {
            url: archiveName,
            checksum: archiveChecksum
        };
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        // Load bls.toml and check last deployment
        const blsConfigPath = path.join(process.cwd(), 'bls.toml');
        const blsConfig = toml.parse(fs.readFileSync(blsConfigPath, 'utf-8'));
        const deployments = blsConfig.deployments || [];
        const lastDeployment = deployments[deployments.length - 1];

        if (lastDeployment && lastDeployment.runtime.checksum === archiveChecksum) {
            console.log('No changes detected since the last deployment. Skipping deployment.');
            return;
        }

        // Submit the archive and manifest
        const manifestBuffer = fs.readFileSync(manifestPath);
        const result = await submitWasmArchive(archiveBuffer, archiveName, manifestBuffer);
        deploySpinner.text = 'Saving Deployment Results ...'

        // Update bls.toml with deployment results
        blsConfig.deployments = [result];
        fs.writeFileSync(blsConfigPath, toml.stringify(blsConfig));

        deploySpinner.succeed('Deployment successful.')

        console.log('\nDeployment Results:\n');
        console.log(`CID: ${result.cid}\n`);

        // Finalize deployment with a POST request
        try {
            const blessDeployKeyPath = path.join(process.cwd(), 'bless-deploy.key');
            const hasBlessDeployKey = fs.existsSync(blessDeployKeyPath);
            const postData = {
                destination: result.cid,
                entry_method: wasmName,
                return_type: config.return_type // Assuming return_type is in the config file
            };

            if (hasBlessDeployKey) {
                const updaterId = fs.readFileSync(blessDeployKeyPath, 'utf-8');
                postData.updater_id = updaterId;
                postData.host = blsConfig.host; // Assuming host is in the blsConfig file

                const response = await fetch('http://ingress.bls.dev/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const responseData = await response.json();
                console.log(`Deployment URL: ${chalk.green(`https://${responseData.host}`)}\n`);
            } else {
                const response = await fetch('http://ingress.bls.dev/insert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const responseData = await response.json();
                console.log(`Deployment URL: ${chalk.green(`https://${responseData.host}`)}\n`);

                console.log(`${chalk.red("!!! WARNING: !!!")}\n`);
                console.log(`${chalk.red("Backup and don't share the ** bless-deploy.key ** file in the project root")}`);
                console.log(`${chalk.red("This is the 'password' to update the deployment URL to a new version of ")}`);
                console.log(`${chalk.red("the project when it is redeployed.")}\n`);

                // Save updater_id to bless-deploy.key
                fs.writeFileSync(blessDeployKeyPath, responseData.updater_id);

                // Update bls.toml with deployment results including host
                blsConfig.host = responseData.host;
                fs.writeFileSync(blsConfigPath, toml.stringify(blsConfig));
            }
        } catch (error) {
            console.error('Error finalizing deployment:', error);
        }
    });

module.exports = deployCommand;

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
const buildCommand = require('../commands/build'); // Import buildCommand
const initCommand = require('../commands/init'); // Import initCommand
const manageCommand = require('../commands/manage'); // Add manage command import

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
    .argument('[targetFolder]', 'target folder for deployment')
    .option('--env <environment>', 'deployment environment (production/development)')
    .action(async (targetFolder, options) => {
        const ora = await getOra();
        const fetch = await getFetch();

        let projectPath = process.cwd();
        const originalCwd = process.cwd();

        if (targetFolder) {
            // Convert targetFolder to absolute path and verify it exists
            const absoluteTargetPath = path.resolve(originalCwd, targetFolder);
            if (!fs.existsSync(absoluteTargetPath)) {
                console.error(chalk.red(`Target folder ${absoluteTargetPath} does not exist`));
                process.exit(1);
            }

            // Use fixed temporary directory
            const tmpDir = path.join(originalCwd, '.bls', 'tmp-deploy');
            fs.rmSync(tmpDir, { recursive: true, force: true }); // Clean up any existing tmp directory
            fs.mkdirSync(path.dirname(tmpDir), { recursive: true });

            // Initialize a new project in the temp directory
            process.chdir(path.dirname(tmpDir));
            await initCommand.parseAsync(['node', 'init', path.basename(tmpDir)]);

            // Copy target folder contents to public directory
            const publicDir = path.join(tmpDir, 'public');
            fs.rmSync(publicDir, { recursive: true, force: true });
            fs.mkdirSync(publicDir, { recursive: true });
            fs.cpSync(absoluteTargetPath, publicDir, { recursive: true });

            // Update index.ts for static file serving
            const indexTsContent = `import WebServer from "@blockless/sdk-ts/dist/lib/web";

const server = new WebServer();

server.statics("public", "/");

server.start();
`;
            fs.writeFileSync(path.join(tmpDir, 'index.ts'), indexTsContent);

            // Use temporary directory as project path
            projectPath = tmpDir;
            // Change working directory to temporary project
            process.chdir(projectPath);

            // Set environment if specified
            if (options.env) {
                await manageCommand.commands
                    .find(cmd => cmd.name() === 'env')
                    .parseAsync(['node', 'env', options.env]);
            }
        }

        await buildCommand.parseAsync(['node', 'build.js']);

        const deploySpinner = ora('Deploying project ...').start();

        // Load configuration from the correct path
        const config = parseBlsConfig(projectPath);

        // Update all path operations to use projectPath instead of process.cwd()
        const isDev = config.environment === 'development';
        const apiEndpoint = isDev ? 'https://dev.bls.dev' : 'https://ingress.bls.dev';
        const blessDeployKeyPath = path.join(
            originalCwd,
            isDev ? 'bless-deploy-dev.key' : 'bless-deploy.key'
        );

        // Check if release build exists
        const releasePath = path.join(projectPath, config.build_release.dir, "release.wasm");
        if (!fs.existsSync(releasePath)) {
            deploySpinner.text = "Building release ...";
            execSync(config.build_release.command, { stdio: 'inherit' });
        }

        // Rename release.wasm to the package.json name
        const packageJson = require('../package.json');
        const wasmName = `${packageJson.name}.wasm`;
        const renamedWasmPath = path.join(projectPath, config.build_release.dir, wasmName);
        fs.renameSync(releasePath, renamedWasmPath);

        // Generate manifest.json
        const manifest = createWasmManifest(wasmName, 'application/javascript');
        const manifestPath = path.join(projectPath, config.build_release.dir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        // Create archive of manifest.json and the renamed wasm file
        const archiveName = `${packageJson.name}.tar.gz`;
        const archivePath = path.join(projectPath, config.build_release.dir, archiveName);
        const archiveBuffer = await createWasmArchive(path.join(projectPath, config.build_release.dir), archiveName, wasmName);

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
        const blsConfigPath = path.join(originalCwd, 'bls.toml');
        const blsConfig = toml.parse(fs.readFileSync(blsConfigPath, 'utf-8'));
        const deployments = blsConfig.deployments || [];
        const lastDeployment = deployments[deployments.length - 1];

        if (lastDeployment && lastDeployment.runtime.checksum === archiveChecksum) {
            console.log('No changes detected since the last deployment. Skipping deployment.');
            deploySpinner.stop();
            process.exit(0);
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
            const hasBlessDeployKey = fs.existsSync(blessDeployKeyPath);
            const postData = {
                destination: result.cid,
                entry_method: wasmName,
                return_type: config.type // Assuming return_type is in the config file
            };

            if (hasBlessDeployKey) {
                const updaterId = fs.readFileSync(blessDeployKeyPath, 'utf-8');
                postData.updater_id = updaterId;
                postData.host = isDev ? blsConfig.development_host : blsConfig.production_host;

                const response = await fetch(`${apiEndpoint}/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const responseData = await response.json();
                console.log(`Deployment URL: ${chalk.green(`https://${responseData.host}`)}\n`);
            } else {
                const response = await fetch(`${apiEndpoint}/insert`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const responseData = await response.json();
                console.log(`Deployment URL: ${chalk.green(`https://${responseData.host}`)}\n`);

                console.log(`${chalk.red("!!! WARNING !!!")}\n`);
                console.log(`${chalk.red("Back up and do not share the ** " + (isDev ? "bless-deploy-dev.key" : "bless-deploy.key") + " ** file in the project root.")}`);
                console.log(`${chalk.red("This key acts as a 'password' for updating the deployment URL when")}`);
                console.log(`${chalk.red("the project is redeployed.")}\n`);
                // Save updater_id to appropriate key file
                fs.writeFileSync(blessDeployKeyPath, responseData.updater_id);

                // Update bls.toml with deployment results including appropriate host
                if (isDev) {
                    blsConfig.development_host = responseData.host;
                } else {
                    blsConfig.production_host = responseData.host;
                }
                fs.writeFileSync(blsConfigPath, toml.stringify(blsConfig));
                fs.copyFileSync(blsConfigPath, path.join(originalCwd, 'bls.toml'));
            }
        } catch (error) {
            console.error('Error finalizing deployment:', error);
            process.exit(1);
        }

        // Cleanup temporary directory if it was created
        if (targetFolder) {
            // Change back to original directory before cleanup
            process.chdir(originalCwd);
            fs.rmSync(path.join(process.cwd(), '.bls'), { recursive: true, force: true });
        }

        process.exit(0);
    });

module.exports = deployCommand;

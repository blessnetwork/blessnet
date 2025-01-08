const { Command } = require('commander');
const { createWasmManifest } = require('../lib/manifest');
const { createWasmArchive, submitWasmArchive } = require('../lib/archive');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const { parseBlsConfig } = require('../lib/config');
const toml = require('@iarna/toml');

const deployCommand = new Command('deploy')
    .description('Deploy your project')
    .action(async () => {
        console.log('Deploy command executed');

        // Load configuration
        const config = parseBlsConfig(process.cwd());

        // Check if release build exists
        const releasePath = path.join(process.cwd(), config.build_release.dir, "release.wasm");
        if (!fs.existsSync(releasePath)) {
            console.log('Release build not found. Building release.wasm...');
            execSync(config.build_release.command, { stdio: 'inherit' });
        }

        // Rename release.wasm to the package.json name
        const packageJson = require('../package.json');
        const wasmName = `${packageJson.name}.wasm`;
        const renamedWasmPath = path.join(process.cwd(), config.build_release.dir, wasmName);
        fs.renameSync(releasePath, renamedWasmPath);
        console.log(`Renamed release.wasm to ${wasmName}`);

        // Generate manifest.json
        const manifest = createWasmManifest(wasmName, 'application/javascript');
        const manifestPath = path.join(process.cwd(), config.build_release.dir, 'manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Manifest generated at ${manifestPath}`);

        // Create archive of manifest.json and the renamed wasm file
        const archiveName = `${packageJson.name}.tar.gz`;
        const archivePath = path.join(process.cwd(), config.build_release.dir, archiveName);
        const archiveBuffer = await createWasmArchive(path.join(process.cwd(), config.build_release.dir), archiveName, wasmName);
        console.log(`Archive created at ${archivePath}`);

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
        console.log(`Manifest updated at ${manifestPath}`);

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
        console.log(`Submission Result: ${JSON.stringify(result)}`);

        // Update bls.toml with deployment results
        blsConfig.deployments = [result];
        fs.writeFileSync(blsConfigPath, toml.stringify(blsConfig));
        console.log(`Updated bls.toml with new deployment results`);
    });

module.exports = deployCommand;

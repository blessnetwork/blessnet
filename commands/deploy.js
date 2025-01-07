const { Command } = require('commander');
const { createWasmManifest } = require('../lib/manifest');
const { createWasmArchive } = require('../lib/archive');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const crypto = require('node:crypto');
const { parseBlsConfig } = require('../lib/config');

const deployCommand = new Command('deploy')
    .description('Deploy your project')
    .action(() => {
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
        const renamedWasmPath = path.join(__dirname, `../foo/build/${wasmName}`);
        fs.renameSync(releasePath, renamedWasmPath);
        console.log(`Renamed release.wasm to ${wasmName}`);

        // Generate manifest.json
        const manifest = createWasmManifest(wasmName, 'application/javascript');
        const manifestPath = path.join(__dirname, '../foo/build/manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`Manifest generated at ${manifestPath}`);

        // Create archive of manifest.json and the renamed wasm file
        const archiveName = `${packageJson.name}.tar.gz`;
        const archivePath = path.join(__dirname, `../foo/build/${archiveName}`);
        createWasmArchive(path.join(__dirname, '../foo/build'), archiveName, wasmName);
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
    });

module.exports = deployCommand;

const { Command } = require('commander');
const { startServer } = require('../lib/server');
const { run } = require('../lib/invoke'); // Corrected to use run function from invoke.js
const buildCommand = require('../commands/build'); // Import buildCommand
const { scanJSFiles } = require('../lib/find-static-paths');
const readline = require('readline');


const previewCommand = new Command('preview')
    .description('Preview your project');

previewCommand
    .command('serve')
    .description('Start the preview server')
    .action(async () => {
        await buildCommand.parseAsync(['node', 'build.js', '--debug']); // Run build command with debug option
        startServer();
    });

previewCommand
    .action(async () => { // Updated to use async/await
        try {
            const staticPaths = scanJSFiles(process.cwd());

            if (staticPaths.length > 0) {
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.question('Static paths detected. Would you like to start the HTTP server instead? (y/n) ', async (answer) => {
                    if (answer.toLowerCase() === 'y') {
                        console.log('You can also use "preview serve" to start the server.');
                        await buildCommand.parseAsync(['node', 'build.js', '--debug']);
                        startServer();
                    } else {
                        console.log('Continuing without starting the server.');
                        const result = await run({ stdin: input });
                        console.log(result);
                    }
                    rl.close();
                });
            }

            let input = '';
            if (!process.stdin.isTTY && process.stdin.readable) {
                process.stdin.setEncoding('utf8');
                process.stdin.on('data', chunk => {
                    input += chunk;
                });
                process.stdin.on('end', async () => {
                    try {
                        await buildCommand.parseAsync(['node', 'build.js', '--debug']);
                        const result = await run({ stdin: input });
                        console.log(result);
                    } catch (error) {
                        console.error('Error:', error);
                    }
                });
                process.stdin.resume();
            } else {
                // No stdin provided, proceed with empty input
                await buildCommand.parseAsync(['node', 'build.js', '--debug']);
                const result = await run({ stdin: input });
                console.log(result);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

module.exports = previewCommand;

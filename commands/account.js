const { Command } = require('commander');
const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('../lib/constants');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const chalk = require('chalk');

const accountCommand = new Command('account');

accountCommand
    .description('Manage your account')
    .action(() => {
        const blessnetDir = path.join(os.homedir(), '.blessnet');
        const tokenPath = path.join(blessnetDir, 'auth_token');
        const isLoggedIn = fs.existsSync(tokenPath); // Check if auth_token file exists
        if (isLoggedIn) {
            console.log(`You are ${chalk.green('logged in.')}`);
        } else {
            console.log(`You are ${chalk.red('logged out.')}`);
        }
    });

accountCommand
    .command('login')
    .description('Log in to your account')
    .action(() => {
        const guid = uuidv4();
        console.log(`Please log in at: ${CONSTANTS.authHost}/?lid=${guid}&clientid=${CONSTANTS.blessAuthClientId}`);

        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${CONSTANTS.authHost}/api/verify-activity`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        lid: guid,
                        clientid: CONSTANTS.blessAuthClientId
                    })
                });
                const text = await response.text();
                if (text.length === 0) {
                    return;
                }

                const data = JSON.parse(text); // Parse the response text as JSON
                if (data.token) {
                    console.log('Log in successful!');
                    const blessnetDir = path.join(os.homedir(), '.blessnet');
                    if (!fs.existsSync(blessnetDir)) {
                        fs.mkdirSync(blessnetDir);
                    }
                    fs.writeFileSync(path.join(blessnetDir, 'auth_token'), data.token);
                    process.exit(0);
                }
            } catch (error) {
                console.error('Error checking log in status:', error);
            }
        };

        const intervalId = setInterval(checkLoginStatus, 5000);
        setTimeout(() => {
            clearInterval(intervalId);
            console.log('Log in check timed out.');
        }, 180000); // 3 minutes
    });

accountCommand
    .command('logout')
    .description('Logout from your account')
    .action(() => {
        const blessnetDir = path.join(os.homedir(), '.blessnet');
        const tokenPath = path.join(blessnetDir, 'auth_token');
        if (fs.existsSync(tokenPath)) {
            fs.unlinkSync(tokenPath);
            console.log('Logout successful. Token destroyed.');
        } else {
            console.log('No token found. You are not logged in.');
        }
    });

module.exports = accountCommand;

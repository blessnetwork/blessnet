const { Command } = require('commander');
const { v4: uuidv4 } = require('uuid');
const CONSTANTS = require('../lib/constants');
const auth = require('../lib/auth');
const chalk = require('chalk');

const accountCommand = new Command('account');

accountCommand
    .description('Manage your account')
    .action(async () => {
        const isLoggedIn = auth.isLoggedIn();
        if (isLoggedIn) {
            // Check if current JWT is valid
            const validJWT = await auth.getValidJWT();
            if (validJWT) {
                console.log(`You are ${chalk.green('logged in.')}`);
            } else {
                console.log(
                    `You are ${chalk.yellow(
                        'logged in but token needs refresh.'
                    )} Please log in again.`
                );
            }
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
                const response = await fetch(
                    `${CONSTANTS.authHost}/api/v1/auth/verify-activity`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            lid: guid,
                            clientid: CONSTANTS.blessAuthClientId
                        })
                    }
                );
                const text = await response.text();
                if (text.length === 0) {
                    return;
                }

                const data = JSON.parse(text); // Parse the response text as JSON
                if (data.jwt && data.refreshToken) {
                    console.log('Verifying JWT...');

                    // Verify JWT before storing
                    const isValid = await auth.verifyJWT(data.jwt);
                    if (!isValid) {
                        console.error('JWT verification failed. Please try again.');
                        return;
                    }

                    console.log('Log in successful!');
                    auth.setAuth(data.jwt, data.refreshToken);
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
        const success = auth.clearAuth();
        if (success) {
            console.log('Logout successful. Tokens cleared.');
        } else {
            console.log('Error during logout.');
        }
    });

module.exports = accountCommand;

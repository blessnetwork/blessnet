const { execSync } = require('node:child_process');

const getNpmVersion = () =>
    execSync("npm --version").toString("utf-8").trim();

const getNpmConfigInitVersion = () =>
    execSync("npm config get init-version").toString("utf-8");

const getNodeVersion = () =>
    execSync("echo $(node -v)").toString("utf-8").replace('v', '').trim();

module.exports = {
    getNpmVersion,
    getNpmConfigInitVersion,
    getNodeVersion
};

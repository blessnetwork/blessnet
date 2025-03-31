const { Command } = require('commander');
const registryStakeCommand = require('./registryStake');


const registryCommand = new Command('registry')
    .description('registry: registry operation for node and wallet')

registryCommand.addCommand(registryStakeCommand)

module.exports = registryCommand;
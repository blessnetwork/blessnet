const { Command } = require('commander');
const registryStakeCommand = require('./registryStake');
const registryDeactiveCommand = require('./registryDeactive');
const registryInfoCommand = require('./registryInfo');


const registryCommand = new Command('registry')
    .description('registry: registry operation for node and wallet')

registryCommand.addCommand(registryStakeCommand)
registryCommand.addCommand(registryDeactiveCommand)
registryCommand.addCommand(registryInfoCommand)

module.exports = registryCommand;
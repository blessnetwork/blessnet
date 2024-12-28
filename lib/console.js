const chalk = require('chalk');
const { Transform } = require('node:stream');
const { Console } = require('node:console');

// Hook all console output to use pino and suppress specific warnings
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
// const originalConsoleError = console.error;
// const originalConsoleDebug = console.debug;
// const originalConsoleInfo = console.info;
// const originalConsoleTrace = console.trace;
// const originalConsoleTable = console.table;

global.console = {
    table: (input) => {
        // @see https://stackoverflow.com/a/67859384
        const ts = new Transform({ transform(chunk, enc, cb) { cb(null, chunk) } })
        const logger = new Console({ stdout: ts })
        logger.table(input)
        const table = (ts.read() || '').toString()
        let result = '';
        for (const row of table.split(/[\r\n]+/)) {
            let r = row.replace(/[^┬]*┬/, '┌');
            r = r.replace(/^├─*┼/, '├');
            r = r.replace(/│[^│]*/, '');
            r = r.replace(/^└─*┴/, '└');
            r = r.replace(/'/g, ' ');
            result += `${r}\n`;
        }
        originalConsoleLog(result);

    },
    log: (msg, ...args) => {
        if (typeof msg === 'string' && !msg.includes('bigint: Failed to load bindings')) {
            originalConsoleLog(msg, ...args);
        }
    },
    warn: (msg, ...args) => {
        if (typeof msg === 'string' && !msg.includes('bigint: Failed to load bindings')) {
            originalConsoleWarn(msg, ...args);
        }
    },
    // Preserve other console methods
    error: console.error.bind(console),
    info: (msg, ...args) => {
        originalConsoleLog(chalk.yellow(msg), ...args);
    },
    debug: (msg, ...args) => {
        originalConsoleLog(chalk.blue(msg), ...args);
    },
    trace: (msg, ...args) => {
        originalConsoleLog(chalk.green(msg), ...args);
    }
};
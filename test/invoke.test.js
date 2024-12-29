const { run } = require('../lib/invoke');
const path = require('node:path');
const assert = require('assert');

describe('run', () => {
    it('should return "hello world!" for the wasm file', async () => {
        const options = {
            wasmPath: path.join(__dirname, '../fixtures/hello_test.wasm'),
            env: ['TEST_ENV=1']
        };
        const result = await run(options);
        assert.strictEqual(result.trim(), 'hello world!');
    });
});


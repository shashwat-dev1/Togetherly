const { webcrypto } = require('node:crypto');

module.exports = { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) };

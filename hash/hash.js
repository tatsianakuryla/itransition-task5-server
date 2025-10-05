const { createHash } = require('node:crypto');

class Hash {
    static get = (password) => {
        return createHash('sha3-256').update(password, 'utf-8').digest('hex');
    }
}

exports.Hash = Hash;
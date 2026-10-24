const crypto = require('crypto');
const [, , passwordHex, saltHex, iterations, length] = process.argv;
process.stdout.write(crypto.pbkdf2Sync(Buffer.from(passwordHex, 'hex'), Buffer.from(saltHex, 'hex'), Number(iterations), Number(length), 'sha256').toString('hex'));

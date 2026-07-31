const crypto = require('crypto');

if (!global.crypto) {
  global.crypto = crypto.webcrypto;
}
if (!globalThis.crypto) {
  globalThis.crypto = crypto.webcrypto;
}

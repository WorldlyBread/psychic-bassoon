const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.alloc(32, 'aGVsbG8gd29ybGQghfghfghasdasdasd', 'utf-8');
const iv = Buffer.alloc(16, 'aGVsbG8gd29ybGQghfghfghhbhjh', 'utf-8');

function encryptMessage(object) {
  let base64 = objToBase64(object);
  let { encryptedData } = encrypt(base64);
  return encryptedData;
}

function decryptMessage(message) {
  let decryptedMsg = decrypt(message);
  let buff = new Buffer(decryptedMsg, 'base64');
  let obj = buff.toString('utf-8');
  return JSON.parse(obj);
}

function encrypt(text) {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
  //  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function objToBase64(obj) {
  let objJsonStr = JSON.stringify(obj);
  let objJsonB64 = Buffer.from(objJsonStr).toString('base64');
  return objJsonB64;
}

module.exports = {
  encryptMessage,
  decryptMessage
};

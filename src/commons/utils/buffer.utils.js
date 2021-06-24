'use strict';

class BufferUtils {
  JSONtoBuffer(obj) {
    return Buffer.from(JSON.stringify(obj));
  }

  BufferToJSON(buffer) {
    return JSON.parse(buffer.toString());
  }

  StringToBuffer(str) {
    return Buffer.from(str);
  }

  BufferToString(buffer) {
    return buffer.toString();
  }
}

module.exports = new BufferUtils();

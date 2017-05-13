'use strict';

const net = require('net');
const Readable = require('stream').Readable;
const iconv = require('iconv-lite');

// telnet protocol character
const IAC   = 0xff;
const DONT  = 0xfe;
const DO    = 0xfd;
const WONT  = 0xfc;
const WILL  = 0xfb;

const SE    = 0xf0;
const NOP   = 0xf1;
const DM    = 0xf2;
const BRK   = 0xf3;
const IP    = 0xf4;
const AO    = 0xf5;
const AYT   = 0xf6;
const EC    = 0xf7;
const EL    = 0xf8;
const GA    = 0xf9;
const SB    = 0xfa;

// telnet protocol options
const BINARY= 0x00;
const SGA   = 0x03;
const NAWS  = 0x1f;
const TTYPE = 0x18;

class Telnet extends Readable {

  constructor(options = {}) {
    super(options);

    // terminal
    this.width  = options.width || 80;
    this.height = options.height || 24;
    this.socket = null;
  }

  connect(options) {
    return new Promise(resolve => {
      const host = options.host || 'localhost';
      const port = options.port || 23;

      this.socket = net.createConnection({host, port}, () => {
        resolve();
      });

      this.socket.on('data', data => {
        this.emit('data', this._filterOutTelnetCommands(data));
      });

    });
  }

  write(chunk, callback) {
    return new Promise((resolve, reject) => {
      this.socket.write(chunk, () => {
        resolve();
      });
    });
  }

  _read(size) {
    this.socket.read(size);
  }

  // presume that command would be at the beginning of payload
  _filterOutTelnetCommands(chunk) {
    let i = 0;
    while (chunk[i] === IAC && chunk[i + 1] !== IAC) {
      if (chunk[i + 1] === SB) {
        i += 2;
        while(!(chunk[i] === IAC && chunk[i + 1] === SE)) i++;
        i += 2;
      }
      else i += 3;
    }
    return chunk.slice(i, chunk.length);
  }
}

module.exports = Telnet;

async function wait(n) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, n)
  });
}

if (!module.parent) {

  async function test() {
    var telnet = new Telnet({
      height: 50
    });
    try {
      await telnet.connect({host: 'ptt.cc', port: 23})
      telnet.on('data', data => {
        console.log(iconv.decode(data, 'Big5'));
      });
      await wait(1000);
      telnet.write(Buffer.from([
            IAC, WILL, TTYPE,
            IAC, SB,
              TTYPE, 0, 0x56, 0x54, 0x31, 0x30, 0x30,
            IAC, SE,
            IAC, WILL, NAWS,
            IAC, SB, NAWS,
              telnet.width >> 8 & 0xFF, telnet.width & 0xFF,
              telnet.height >> 8 & 0xFF, telnet.height & 0xFF,
            IAC, SE,
            IAC, DONT, SGA,
            IAC, WONT, SGA
      ]));
      telnet.write('');
      await wait(1000);
      telnet.write(Buffer.from([0x1b, 'OA']));
      await wait(500);
      telnet.write(Buffer.from([
        IAC, DONT, SGA
      ]));
      await wait(1000);
      telnet.write('sgossiping\r');
      await wait(1000);
      telnet.write('\r');
    } catch(err) {
      console.error(err);
    }
  }

  test();
}

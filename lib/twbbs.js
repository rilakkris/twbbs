'use strict';

const Telnet = require('./telnet');
const Terminal = require('./terminal');

class TwBBS {
  constructor(options) {
    // width, height
    this.host = null;
    this.port = 23;
    this.telnet = new Telnet(options);
    this.terminal = new Terminal(options);
    this.telnet.pipe(this.terminal);
  }

  connect(options) {
    // options: host, [port], id, passwd
    const host = options.host;
    const port = options.port || 23;
    return this.telnet.connect({host, port});
  }

}

if (!module.parent) {
  async function test() {
    var cd = new TwBBS();
    await cd.connect({ host: 'ptt.cc' });
    setTimeout(() => { console.log(cd.terminal); }, 1000);
    setTimeout(() => { console.log(cd.terminal); }, 1000);
  }

  try {
    test();
  } catch(e) {
    console.log(e);
  }
}

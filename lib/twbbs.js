'use strict';

const Telnet = require('./telnet');
const Terminal = require('./terminal');

class TwBBS {
  constructor(options) {
    // width, height
    if (typeof options === undefined)
      throw new Error('options with host are required!!');
    this.host = options.host;
    this.port = options.port || 23;
    this.telnet = new Telnet(options);
    this.terminal = new Terminal(options);
    //this.telnet.pipe(this.terminal);
  }

  connect(options) {
    // options: host, port, id, passwd
    const host = options.host;
    const port = options.port || 23;
    return this.telnet.connect({host, port});
  }

}

if (!module.parent) {
  async function test() {
    var cd = new TwBBS({ height: 50 });
    await cd.connect({ host: 'ptt.cc' });
  }

  try {
    test();
  } catch(e) {
    console.log(e);
  }
}

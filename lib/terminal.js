
const Writable = require('stream').Writable;
const iconv = require('iconv-lite');
const AnsiTokenizer = require('ansi-tokenizer');

class Terminal extends Writable {

  constructor(options = {}) {
    super(options);

    this.width = options.width || 80;
    this.height = options.height || 24;

    this.cursor = [1, 1];
    // the terminal is presented in 2 layers,
    // one for plain text, the other for colors
    this.text = new Array(this.height + 1);
    for(let i = 0; i < this.height; i++)
      this.text[i] = new Array(this.width + 1);

    this.color = new Array(this.height + 1);
    for(let i = 0; i < this.height; i++)
      this.color[i] = new Array(this.width + 1);

    this._ansiTokenizer = new AnsiTokenizer({
      '\\x1b\\[(\\d+(;\\d+)*)m'   : ['SGR', 'color', 'dummy'],
      '\\x1b\\[((\\d+);(\\d+))?H' : ['CUP', 'position', 'row', 'column'],
      '\\x1b\\[K'                 : ['EL' ],
    });

		this._unconsumed = '';
  }

  inspect() {
    return this.text
      .map((line) => {return line.join('')})
      .join('\n')
  }

  _consumeToken(token) {
    const self = this;
    const tokenHandler = {
      'SGR': t => {
        // TODO
        this.color[this.cursor[0]][this.cursor[1]] = t.color;
      },
      'CUP': t => {
        if (t.position === undefined) {
          this.cursor = [1, 1];
        }
        else this.cursor = [t.row, t.column];
      },
      'DAT': t => {
        var dat = iconv.decode(t.raw, 'Big5');
        for(let i = 0; i < dat.length; i++) {
          this.text[this.cursor[0]][this.cursor[1]++] = dat[i];
          if (this.cursor[1] === this.width + 1) {
            this.cursor[0]++;
            this.cursor[1] = 0;
          }
        }
      }
    };
    tokenHandler[token.code].call(this, token);
  }

  _write(chunk, encoding, callback) {
    this._ansiTokenizer.write(chunk);
    this._ansiTokenizer
      .read()
      .forEach(this._consumeToken, this);
    callback();
  }

}

module.exports = Terminal;

if (!module.parent) {
  var terminal = new Terminal();
  terminal.write(Buffer.from([
    0x1b, 0x5b, 0x48, 0x1b, 0x5b, 0x31, 0x3b, 0x33, 0x37, 0x3b, 0x34, 0x34, 0x6d, 0xa1, 0x69, 0xaa,
    0x4f, 0xa5, 0x44, 0x3a, 0x6b, 0x61, 0x73, 0x69, 0x6f, 0x6e, 0x2f, 0x4d, 0x65, 0x77, 0x73, 0x2f,
    0x49, 0x62, 0x61, 0x6b, 0x61, 0x42, 0x6c, 0x6f, 0x63, 0x6b, 0xa1, 0x6a, 0x1b, 0x5b, 0x33, 0x33,
    0x6d, 0x5b, 0xa4, 0x4b, 0xa8, 0xf6, 0x5d, 0x20, 0xb6, 0x67, 0xa5, 0xbd, 0xa5, 0xc0, 0xbf, 0xcb
  ]));
  terminal.write(Buffer.from([
    0xb8, 0x60, 0x1b, 0x5b, 0x30, 0x3b, 0x31, 0x3b, 0x33, 0x37, 0x3b, 0x34, 0x34, 0x6d, 0x20, 0x20,
    0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0xac, 0xdd, 0xaa, 0x4f,
    0xa1, 0x6d, 0x47, 0x6f, 0x73, 0x73, 0x69, 0x70, 0x69, 0x6e, 0x67, 0xa1, 0x6e, 0x0d, 0x0a, 0x1b,
	]));
  console.log(terminal);
}

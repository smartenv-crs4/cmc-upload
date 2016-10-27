const EventEmitter = require('events');

class BaseDriverStream extends EventEmitter {

  constructor(stream) {
    super();
    this.stream = stream;

    this.stream.on('error', () => {
      this.emit('streamError');
    });
  }

  emitClose(id) {
    this.emit('streamClose', {filecode:id});
  }

  getStream() {return this.stream;}

  close() {this.stream.close();}

  destroy() {this.stream.destroy();}

}


module.exports = exports = BaseDriverStream;

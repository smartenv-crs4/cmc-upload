const EventEmitter = require('events');

class BaseDriverStream extends EventEmitter {

  constructor(stream) {
    super();
    this.stream = stream;
  }

/**
  * Your driver must bind the 'close' event of the writeable this.stream and call 
  * emitClose, passing to it an id that identify the new stored resource in your 
  * storage system. 
  * Emits a 'streamClose' event with the id parameter for the callback
  *
  * You can then use this parameter in your code to handle the new resource:
  * example:
  *
  *   yourDriverWriterStream.on('streamClose', function(filecode) {
  *     res.pipe(yourDriver.newReadStream(filecode));
  *   });
  *
  * @param  id  The id of the new stored resource written by this stream
  */
  emitClose(id) {
    this.emit('streamClose', id);
  }

  getStream() {return this.stream;}

  close() {this.stream.close();}

  destroy() {this.stream.destroy();}

}


module.exports = exports = BaseDriverStream;

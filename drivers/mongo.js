const db = require('../lib/db');
const Grid = require('gridfs-stream');
const mongo = require('mongodb');
const BaseDriverStream = require('./base');

class DriverStream extends BaseDriverStream {
  constructor(newStream){
    super(newStream);
 
    this.stream.on('close', (file) => {
      super.emitClose(file ? {id:file._id, size:file.length} : '');
    });
  }
}

/**
  * To implement a new driver you must define a new class similar to the following one.
  *
  * NOTE that newWriteStream and newReadStream must return BaseDriverStream object, not
  * a simple stream object.
  */
class Driver {
  constructor() {
    this.gfs = Grid(db.get(), mongo);
  }

  newWriteStream(filename) {
    return new DriverStream(this.gfs.createWriteStream({filename: filename}));
  }  

  newReadStream(id) {
    return new DriverStream(this.gfs.createReadStream({_id: id}));
  }

  remove(id, cb) {
    try {
      this.gfs.remove({_id:id}, (err) => {
        if(err) {
          cb(err)
        }
        else cb();
      }); 
    }
    catch(e) {
      console.log(e); 
    }
  }

  exists(id, cb) {
    this.gfs.exist({_id:id}, function (err, found) {
      if(err) {
        console.log(err);
        cb(err);
      }
      cb(undefined, found);
    });
  }
}

module.exports = exports = {
  Driver: Driver,
  DriverStream: DriverStream
}

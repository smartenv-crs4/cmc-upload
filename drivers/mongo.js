const db = require('../lib/db');
const Grid = require('gridfs-stream');
const mongo = require('mongodb');
const BaseDriverStream = require('./base');

class DriverStream extends BaseDriverStream {
  constructor(newStream){
    super(newStream);
 
    this.stream.on('close', (file) => {
      super.emitClose(file ? file._id : '');
    });
  }
}

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

  remove(id) {
    try {
      this.gfs.remove({_id:id}, (err) => {
        if(err) {
          console.log(err);
        }
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
        return;
      }
      cb(found);
    });
  }
}

module.exports = exports = {
  Driver: Driver,
  DriverStream: DriverStream
}

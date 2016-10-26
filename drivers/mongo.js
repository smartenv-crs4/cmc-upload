var db = require('../lib/db');
var Grid = require('gridfs-stream');
var mongo = require('mongodb');
var Stream = require('stream');

const EventEmitter = require('events');
const MongoStreams = require('stream');

class MongoStream extends MongoStreams {}

class DriverStream extends EventEmitter {
  constructor(newStream){
    super();
    this.stream = newStream; 

    this.stream.on('error', (err) => {
      this.emit('streamError');
    });
 
    this.stream.on('close', (file) => {
      this.emit('streamClose', file ? {filecode:file._id, filename:file.filename} : '');
    });
  }

  getStream() {return this.stream;}

  close() {this.stream.close();}

}


var Driver = function() {
  this.gfs = Grid(db.get(), mongo);
}

Driver.prototype.constructor = Driver;

Driver.prototype.newWriteStream = function (filename) {
  return new DriverStream(this.gfs.createWriteStream({filename: filename}));
}

Driver.prototype.newReadStream = function(id) {
  return new DriverStream(this.gfs.createReadStream({_id: id}));
}

Driver.prototype.remove = function(id) {
  this.gfs.remove({_id:id}, (err) => {
    if(err) console.log(err); //TODO return??
  }); 
}

Driver.prototype.exists = function(id, cb) {
  this.gfs.exist({_id:id}, function (err, found) {
    if(err) {
      console.log(err);
      return;
    }
    cb(found);
  });
}


module.exports = exports = Driver;

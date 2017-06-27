/*
 ############################################################################
 ############################### GPL III ####################################
 ############################################################################
 *                         Copyright 2017 CRS4                                 *
 *    This file is part of CRS4 Microservice Core - Upload (CMC-Upload).      *
 *                                                                            *
 *     CMC-Upload is free software: you can redistribute it and/or modify     *
 *     it under the terms of the GNU General Public License as published by   *
 *       the Free Software Foundation, either version 3 of the License, or    *
 *                    (at your option) any later version.                     *
 *                                                                            *
 *     CMC-Upload is distributed in the hope that it will be useful,          *
 *      but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the        *
 *               GNU General Public License for more details.                 *
 *                                                                            *
 *     You should have received a copy of the GNU General Public License      *
 *    along with CMC-Upload.  If not, see <http://www.gnu.org/licenses/>.    *
 * ############################################################################
 */

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
          if(cb) cb(err)
        }
        else if(cb) cb();
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
        if(cb) cb(err);
      }
      if(cb) cb(undefined, found);
    });
  }
}

module.exports = exports = {
  Driver: Driver,
  DriverStream: DriverStream
}

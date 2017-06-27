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

  destroy() {this.stream.destroy();}

}


module.exports = exports = BaseDriverStream;

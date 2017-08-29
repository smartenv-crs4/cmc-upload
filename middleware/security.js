<<<<<<< HEAD
=======
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

>>>>>>> 8ad0c425ce4184b967ddcbd5e123d0160eabf990
const authField = require('propertiesmanager').conf.decodedTokenFieldName;
const auth = require('tokenmanager');

module.exports = exports = {

  authWrap : (req, res, next) => {
    if(req.app.get("nocheck")) { //In dev mode non richiede il ms authms, usa utente fake passato da url TODO rimuovere?
        req[authField] = {};
        req[authField]._id = req.query.fakeuid;
        next();
    }
    else auth.checkAuthorization(req, res, next);
  }
}

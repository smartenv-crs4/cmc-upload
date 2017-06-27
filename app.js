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

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const boom = require('express-boom');
const busboy = require('connect-busboy');
const app = express();
const file = require('./routes/file');
const config = require('propertiesmanager').conf;

if(app.get('env') != 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(boom());

if(config.enableCors === true) {
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, Authorization, Content-Length, X-Requested-With');
    if ('OPTIONS' == req.method) res.send(200);
    else next();
  });
}

if (app.get('env') === 'dev' || app.get('env') === 'test' ) {
  app.set('nocheck', true);
  console.log("INFO: Development/test mode, skipping token checks"); 
}

//routes
app.use('/doc', express.static('doc',{root:'doc'}));
app.use('/', file);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).json(err.message);
  });
}

// production error handler
// no stacktraces leaked to user
/*
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
*/

module.exports = app;

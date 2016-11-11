const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const boom = require('express-boom');
const busboy = require('connect-busboy');
const app = express();
const file = require('./routes/file');
const config = require('propertiesmanager').conf;

let prefix = '/api/v1'; //TODO gestire meglio

if(app.get('env') != 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(boom());
app.use(busboy({immediate:true, limits:{fileSize:config.sizeLimit}}));

var allowCrossDomain = function(req, res, next)
{
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, Authorization, Content-Length, X-Requested-With');
  if ('OPTIONS' == req.method)
  {
    res.send(200);
  }
  else
  {
    next();
  }
}
app.use(allowCrossDomain);


if (app.get('env') === 'dev' || app.get('env') === 'test' ) {
  app.set('nocheck', true);
  console.log("INFO: Development/test mode, skipping token checks"); 
}

//routes
app.use(prefix + '/doc', express.static('doc',{root:'doc'}));
app.use(prefix, file);


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

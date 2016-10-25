var express = require('express');
var mongo = require('mongodb');
var Grid = require('gridfs-stream');
var busboy = require('connect-busboy');
var router = express.Router();
var db = require('../lib/db');


router.post('/file', (req, res, next) => {
  var gfs = Grid(db.get(), mongo);
  req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
    if (!filename) {
      res.boom.badRequest("missing file");
      return;
    }

    var mongoWriteStream = gfs.createWriteStream({
      filename: filename
    });
    file.pipe(mongoWriteStream);

    mongoWriteStream.on('error',(err) => {
      console.log(err);
      res.boom.badImplementation();
    });

    file.on('error', function(err) {
      console.log('Error while savomg the stream: ', err);
      mongoWriteStream.close((file) => {
        console.log('Removing file chunks from db');
        gfs.remove({_id:file._id}, (err) => {
          if(err) console.log(err);
        }); 
      })
      res.boom.badImplementation();
    });
    
    mongoWriteStream.on('close', (file) => {
      res.json({filecode:file._id, filename:file.filename});
    });

  });
});


router.get('/file/:id', (req, res, next) => {
  var gfs = Grid(db.get(), mongo);
  let id = req.params.id;
  if(!id) res.boom.badRequest('Missing file id');
  else {
    gfs.exist({_id:id}, function (err, found) {
      if (err) return handleError(err);
      if(found) {

        var readstream = gfs.createReadStream({_id: id});
        readstream.pipe(res);
  
        readstream.on('error', function (err) {
          console.log(err);
          res.boom.badImplementation();
        });
      }
      else {
        res.boom.notFound();
      }
    }); 
  }
});


module.exports = router;

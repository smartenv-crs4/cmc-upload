const express = require('express');
const busboy = require('connect-busboy');
const router = express.Router();
const mongo = require('mongodb');
const mongoConnection = require('../lib/db');
const Driver = require('../drivers/mongo');

//TODO add auth middleware
router.post('/file', (req, res, next) => {
  let driver = new Driver(); //TODO da config e unica istanza per post e get!!!!
  let newFile = {};
  let db = mongoConnection.get();
  let streamCounter = 0;
  req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
 
    if (!filename) {
      res.boom.badRequest("missing file");
      return;
    }

    let writeStream = driver.newWriteStream(filename);
    streamCounter++;
    file.pipe(writeStream.getStream());

    file.on('error', function(err) {
      console.log(err);
      try {
        writeStream.close((file) => { //TODO test!!!!
          console.log('Removing file chunks from db');
          driver.remove(file.filecode);
        })
      }
      catch(e) {
        console.log("WARNING: unable to remove chunk after upload failure")
        console.log(e);
      }
      res.boom.badImplementation();
    });

    file.on('limit', function() {
      console.log("File size limit reached!");
      //TODO bloccare stream, cancellare trunc, restituire array file rifiutati
    });
  
    writeStream.on('streamError', (err) => {
      res.boom.badImplementation();
    });
 
    writeStream.on('streamClose', (storedFile) => {
      newFile[fieldname] = storedFile.filecode; 
      if(--streamCounter == 0) {
        db.collection('files').insert(newFile, (err, result) => {
          if(err) {
            console.log(err);
            cleanup(driver, newFile);
            res.boom.badImplementation();
            return;
          }
          res.json({filecode:newFile._id});
        });
      }
    });
  });
});


router.get('/file/:id', (req, res, next) => {
  let driver = new Driver();
  let id = req.params.id;
  let tag = req.query.tag;
  let db = mongoConnection.get();
  if(!id) res.boom.badRequest('Missing file id');
  else {
    db.collection('files').findOne({_id:new mongo.ObjectId(id)}, function(err, result) {
      if(err) {
        res.boom.badImplementation();
        return;
      }
      if(!result) {
        res.boom.notFound();
        return;
      }
      //if tag is missing returns the first item
      if(!tag || tag.length == 0) {
        let keys = Object.keys(result);
        for(let i=0; i<keys.length;i++) {
          if(keys[i] != '_id') {
            tag = keys[i];
            break;
          }
        }
      }
      if(!result[tag]) {
        res.boom.notFound();
        return;
      }
      let readStream = driver.newReadStream(result[tag]).getStream();
      readStream.pipe(res); 
    });
  }
});


router.delete('/file/:id', (req, res, next) => {
  //TODO
});



//private
function cleanup(driver, docs) {
  Object.keys(docs).forEach(function(k, i) {
    if(k != '_id') { 
      try { 
        console.log("Removing chunk " + docs[k]);
        driver.remove(docs[k]); 
      } catch(e) {console.log(e);} 
    }
  });
}



module.exports = router;

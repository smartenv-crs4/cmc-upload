const express = require('express');
const busboy = require('connect-busboy');
const router = express.Router();
const mongo = require('mongodb');
const mongoConnection = require('../lib/db');
const config = require('propertiesmanager').conf;
const DriverStream = require('../drivers/base');
const Driver = require('../drivers/' + config.driver).Driver;

var auth = require('tokenmanager');
var authField = config.security.decodedTokenFieldName;

auth.configure(config.security)

//authms middleware wrapper for dev environment (no authms required)
function authWrap(req, res, next) {
  if(!req.app.get("nocheck")) 
    auth.checkAuthorization(req, res, next);
  next();
}




/**
 * @api {post} /file/ Store a new file on your remote storage system
 * @apiGroup Upload
 *
 * @apiDescription Read a multipart request looking for <i>file</i> fields and streams them to your remote storage system.
 *                 Multiple file field in the same request are stored as a sigle resource, each chunk is identified by the 
 *                 fieldname attribute of the multipart field, that should be passed to the GET method to retrieve the chunk.
 *
 * @apiSuccess (200) {Object} body A Json containig the stored resource id and, an array containing failed uploads fieldname, if any.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "filecode": "ABCDEFG1234",
 *       "failed": ["chunk1", "chunk2"]
 *     }
 */
router.post('/file', authWrap, (req, res, next) => { //TODO auth middleware
  let driver = new Driver();
  let newFile = {};
  let db = mongoConnection.get();
  let streamCounter = 0;
  let failed = []
  req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
 
    if (!filename) {
      res.boom.badRequest("missing file");
      return;
    }

    let writeStream = driver.newWriteStream(filename);
    if(!(writeStream instanceof DriverStream)) {
      console.log("Invalid Driver stream, must be instance of BaseDriverStream, check your driver implementation");
      res.boom.badImplementation('Invalid storage driver');
      return;
    }
    streamCounter++;
    file.pipe(writeStream.getStream());

    file.on('error', function(err) {
      console.log(err);
      try {
        writeStream.close((file) => {
          req.app.logger('Removing file chunks from db');
          driver.remove(file.filecode);
        })
      }
      catch(e) {
        console.log("WARNING: unable to remove chunk after upload failure")
        console.log(e);
      }
    });

    file.on('limit', function() {
      console.log("File size limit reached!");
      failed.push(fieldname);
      writeStream.destroy();
    });
  
    writeStream.on('streamClose', (storedFile) => {
      streamCounter--;
      if(file.truncated) {
        try {
          console.log("Cleaning truncated chunk");
          driver.remove(storedFile.id); 
        } 
        catch(e) {
          console.log(e);
        }
      }
      else {
        newFile[fieldname] = storedFile;
      }
      if(streamCounter == 0 && Object.keys(newFile).length > 0) {
        db.collection('files').insertOne(newFile, (err, result) => {
          if(err) {
            console.log(err);
            cleanup(driver, newFile);
            res.boom.badImplementation();
          }
          else res.json({filecode:result.insertedId, failed:failed});
        });
      }
      else if(streamCounter == 0 && Object.keys(newFile).length == 0) {
        res.boom.badImplementation();
      }
    });
  });
});


/**
 * @api {get} /file/:id Return a stored resource
 * @apiGroup Upload
 *
 * @apiDescription  Retrieves a resource by id from the storage system. To get a particular chunk, if 
 *                  multiple were uploaded in a single multipart request (see POST method), you can access
 *                  the requested chunk passing the fieldname used in the multipart upload request: <i>?tag=fieldname</i>
 * @apiParam  {String} id   The unique identifier of the resource
 * @apiParam  {String} tag  The identifier of the requested chunk, if missing first the one found is returned
 *
 * @apiSuccess (200) {Stream} The file stream.
 */
router.get('/file/:id', authWrap, (req, res, next) => {
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
      let readStream = driver.newReadStream(result[tag].id);
      if(!(readStream instanceof DriverStream)) {
        console.log("Invalid Driver stream, must be instance of DriverStream, check your driver implementation--");
        res.boom.badImplementation;
        return;
      }
      res.set('Content-Length', result[tag].size);
      readStream.getStream().pipe(res); 
    });
  }
});


/**
 * @api {delete} /file/:id Delete a resource from the storage system
 * @apiGroup Upload
 *
 * @apiDescription  Deletes the resource identified by <i>id</i>. 
 *                  All the associated chunks (multipart multi file)
 *                  are deleted too.
 * @apiParam  {String} id   The unique identifier of the resource
 *
 * @apiSuccess (200) The file is removed
 */
router.delete('/file/:id', authWrap, (req, res, next) => {
  let driver = new Driver();
  let id = req.params.id;
  let db = mongoConnection.get();
  try {
    db.collection('files').findOne({_id:new mongo.ObjectId(id)}, (err, result) => {
      cleanup(driver, result, (err) => {
        if(err) {
 //         console.log(err);
          res.boom.badImplementation();
        }
        else {
          db.collection('files').remove({_id:new mongo.ObjectId(id)}, (e, r) => {
            if(e) res.boom.badImplementation();
            else if(r.nRemoved == 0) res.boom.notFound();
            else res.end();            
          });
        }
      });
    });
  }
  catch(e) {
//    console.log(e);
    res.boom.badImplementation();
  }
});



function cleanup(driver, docs, cb) {
  Object.keys(docs).forEach(function(k, i) {
    if(k != '_id') { 
      try { 
        driver.remove(docs[k].id, (err) => {
          if(err) console.log(err);
          if(cb) cb(err);
        }); 
      } 
      catch(e) {console.log(e);} 
    }
  });
}



module.exports = router;

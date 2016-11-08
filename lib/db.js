var MongoClient = require('mongodb').MongoClient
var config = require('propertiesmanager').conf;

var state = {
  db: null,
}

exports.connect = function(done) {
  let url = "mongodb://" + config.dbHost + ":" + config.dbPort + "/" + config.dbName;
  if (state.db) return done()

  MongoClient.connect(url, function(err, db) {
    if (err) return done(err)
    state.db = db
    done()
  })
}

exports.get = function() {
  return state.db
}

exports.close = function(done) {
  if (state.db) {
    state.db.close(function(err, result) {
      state.db = null
      state.mode = null
      done(err)
    })
  }
}


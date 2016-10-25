var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('Cagliari Port 2020 - File Upload/Download microservice');
});

module.exports = router;

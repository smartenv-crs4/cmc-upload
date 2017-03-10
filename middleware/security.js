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

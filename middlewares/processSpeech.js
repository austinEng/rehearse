var NodeCache = require( "node-cache" );
var dataCache = new NodeCache();

var processSpeech = function(req, res, next) {
  if (req.body.finished==false) {   // request isn't finished yet!
      dataCache.get(req.body.hash, function (err, value) {
      if (err) {
        res.sendStatus(500);
      }
      if (typeof(value) === "undefined") {
        dataCache.set(req.body.hash, req.body, function (err, success) {
          if (err) {
            res.sendStatus(500);
          }
          res.sendStatus(200);
        });
      } else {
        value.data = value.data.concat(req.body.data);
        dataCache.set(req.body.hash, value, function (err, success) {
          if (err) {
            res.sendStatus(500);
          }
          res.sendStatus(200);
        });
      }
      });
    } else {            // request has completed!
      dataCache.get(req.body.hash, function (err, value) {
      if (err) {
        res.sendStatus(500);
      }
      if (typeof(value) === "undefined") {

      } else {
        value.data = value.data.concat(req.body.data);
        req.body = value;
      }
      req.body.finished = true;
      next();
    });
    }
};

module.exports = processSpeech;

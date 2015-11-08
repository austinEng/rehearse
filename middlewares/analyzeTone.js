var watson = require('watson-developer-cloud');
var bluemix = require('../config/bluemix');
var extend = require('util')._extend;

var credentials = extend({
  version: 'v2',
  username: 'a229347f-d55c-4880-bf05-2e2d51e36b78',
  password: 'WlvgUYykCS1z'
}, bluemix.getServiceCreds('tone_analyzer'));

// Create the service wrapper
var toneAnalyzer = watson.tone_analyzer(credentials);

// Turn service on or off
var on = false;

var analyzeTone = function (req, res, next) {
  var test = { text: "Hello. Analyze my tone please, Watson. Please?" };
  if (on) {
    toneAnalyzer.tone(test, function (error, data) {
      if (error) {
        next(error);
      } else {
        console.log(data);
      }
    });
  }
};

module.exports = analyzeTone;
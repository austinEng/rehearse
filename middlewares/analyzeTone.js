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
  var tone = {};
  var test = { text: "Hello. Analyze my tone please, Watson. Please?" };
  if (on) {
    toneAnalyzer.tone(test, function (error, data) {
      if (error) {
        next(error);
      } else {
        console.log(data);
        var tone = {}; 
        tone.emotion_tone = {};
        tone.writing_tone = {};
        tone.social_tone = {};
        tone.emotion_tone.cheerfulness = req.children[0].children[0].normalized_score;
        tone.emotion_tone.negative = req.children[0].children[1].normalized_score;
        tone.emotion_tone.anger = req.children[0].children[2].normalized_score;
        tone.writing_tone.analytical = req.children[1].children[0].normalized_score;
        tone.writing_tone.confident = req.children[1].children[1].normalized_score;
        tone.writing_tone.tentative = req.children[1].children[2].normalized_score;
        tone.social_tone.openness = req.children[2].children[0].normalized_score;
        tone.social_tone.agreeableness = req.children[2].children[1].normalized_score;
        tone.social_tone.conscientiousness = req.children[2].children[2].normalized_score;
        total = tone.emotion_tone.cheerfulness + tone.emotion_tone.negative + tone.emotion_tone.anger 
                    + tone.writing_tone.analytical + tone.writing_tone.confident + tone.writing_tone.tentative
                    + tone.social_tone.openness + tone.social_tone.agreeableness + tone.social_tone.conscientiousness;
        tone.emotion_tone.score = (tone.emotion_tone.cheerfulness + 
                tone.emotion_tone.negative + tone.emotion_tone.anger)/total; 
        tone.writing_tone.score = (tone.writing_tone.analytical + 
                tone.writing_tone.confident + tone.writing_tone.tentative)/total;
        tone.social_tone.score = (tone.social_tone.openness + 
        tone.social_tone.agreeableness + tone.social_tone.conscientiousness)/total;
        res.speech_data.tone_data = tone; 
      }
    });
  }
};

module.exports = analyzeTone;
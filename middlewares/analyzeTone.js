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
  var tone = { emotion_tone: {}, writing_tone: {}, social_tone: {} };
  var test = { text: "Hi Team, I know the times are difficult! Our sales have been disappointing for the past three quarters for our data analytics product suite. We have a competitive data analytics product suite in the industry. But we need to do our job selling it! We need to acknowledge and fix our sales challenges. We can’t blame the economy for our lack of execution! We are missing critical sales opportunities. Our product  is in no way inferior to the competitor products. Our clients are hungry for analytical tools to improve their business outcomes. Economy has nothing to do with it. In fact, it is in times such as this, our clients want to get the insights they need to turn their businesses around. Let’s buckle up and execute. In summary, we have a competitive product, and a hungry market. We have to do our job to close the deals" };
  if (on) {
    toneAnalyzer.tone(test, function (error, data) {
      if (error) {
        next(error);
      } else {
        tone.emotion_tone.cheerfulness = 
          { percentile: data.children[0].children[0].normalized_score,
            words: data.children[0].children[0].linguistic_evidence[0].words };
        tone.emotion_tone.negative = 
          { percentile: data.children[0].children[1].normalized_score,
            words: data.children[0].children[1].linguistic_evidence[0].words };
        tone.emotion_tone.anger = 
          { percentile: data.children[0].children[2].normalized_score,
            words: data.children[0].children[2].linguistic_evidence[0].words };
        tone.writing_tone.analytical = 
          { percentile: data.children[1].children[0].normalized_score,
            words: data.children[1].children[0].linguistic_evidence[0].words };
        tone.writing_tone.confident = 
          { percentile: data.children[1].children[1].normalized_score,
            words: data.children[1].children[1].linguistic_evidence[0].words };
        tone.writing_tone.tentative = 
          { percentile: data.children[1].children[2].normalized_score,
            words: data.children[1].children[2].linguistic_evidence[0].words };
        tone.social_tone.openness = 
          { percentile: data.children[2].children[0].normalized_score,
            words: data.children[2].children[0].linguistic_evidence[0].words };
        tone.social_tone.agreeableness = 
          { percentile: data.children[2].children[1].normalized_score,
            words: data.children[2].children[1].linguistic_evidence[0].words };
        tone.social_tone.conscientiousness = 
          { percentile: data.children[2].children[2].normalized_score,
            words: data.children[2].children[2].linguistic_evidence[0].words };
        res.speech_data.tone_data = tone;
      }
    });
  }
};

module.exports = analyzeTone;
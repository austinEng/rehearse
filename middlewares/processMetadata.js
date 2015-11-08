var processMetadata = function (req, res, next) {

  console.log('Received data!');
  // console.log(req.body.data);
  var final_results = [];
  var gaps = [];
  for (var i = 0; i < req.body.data.length; i++) {
  	var guess = req.body.data[i];
  	if (guess.results[0].final)
  		final_results.push(guess.results[0].alternatives[0]);
  }
  if (final_results.length == 0) {
    if (!req.body.data || !req.body.data[req.body.data.length - 1]) {
        res.speech_data = {};
        next();
    } else {
        final_results.push(req.body.data[req.body.data.length - 1].results[0].alternatives[0]);
    }
  }
  if (!final_results[0]) {
    res.speech_data = {};
    next();
  }
  var timestamps = final_results[0].timestamps;
  for (var i = 0; i < timestamps.length - 1; i++) {
    var word1 = timestamps[i][0];
    var word2 = timestamps[i + 1][0];
    var time = timestamps[i + 1][1] - timestamps[i][2];
    if (word1 != word2) {
        gaps[i] = [word1, word2, time];
    }
  }
  // sentence
  var words = timestamps.map(function(x) {
    return x[0];
  });

  var sentence = words.join(" ");
  // wpm = len(words) / (last timestamp time / 60)
  var wpm = words.length / (timestamps[timestamps.length - 1][2] / 60);

  // confidence
  var confidences = final_results[0].word_confidence;

  // enunciations
  var hesitations = [];
  var enunciations = [];

  for (var i = 0; i < timestamps.length; i++) {
    if (timestamps[i][0].indexOf('%HESITATION') > -1) {
        hesitations.push(timestamps[i]);
    } else {
        enunciations.push(timestamps[i]);
    }
  }


  var result = {"pauses": gaps, "hesitations": hesitations, "wpm": wpm, "enunciations": enunciations, "sentence": sentence};
  res.speech_data = result;
  res.sendStatus(200);
  console.log(result);
  next();
};

module.exports = processMetadata;

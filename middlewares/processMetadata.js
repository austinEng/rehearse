var processMetadata = function (req, res, next) {

  console.log('Received data!');
  // console.log(req.body.data);
  var final_results = req.body.data.filter(function (guess) {
    return guess.results[0].final;
  });
  final_results = final_results.map(function (x) {
    return x.results[0];
  });
  console.log('line 11');
  var gaps = [];
  // for (var i = 0; i < req.body.data.length; i++) {
  // 	var guess = req.body.data[i];
  // 	if (guess.results[0].final)
  // 		final_results.push(guess.results[0].alternatives[0]);
  // }
  // if (final_results.length == 0) {
  //   if (!req.body.data || !req.body.data[req.body.data.length - 1]) {
  //       res.speech_data = {};
  //       console.log("No results...");
  //       next();
  //   } else {
  //       final_results.push(req.body.data[req.body.data.length - 1].results[0].alternatives[0]);
  //   }
  // }

  var seen = {}
  final_results.filter(function(item) {
    return seen.hasOwnProperty(item.timestamps[0]) ? false : (seen[item.timestamps[0]] = true)
  });
  final_result = {}
  console.log('line 33');
  for (var i = 0; i < final_results.length; i++) {
    for (var key in src) {
        if (!final_result.hasOwnProperty(key)) {
            final_result[key] = src[key];
        } else {
            final_result[key].concat(src[key]);
        }
    }
  }
  console.log('final_result');
  console.log(final_result);
  console.log(final_result.alternatives);
  console.log(final_result.word_confidence);
  if (!final_result) {
    res.speech_data = {};
    next();
  }
  var timestamps = final_result.alternatives[0].timestamps;
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
  var confidences = final_result.word_confidence;

  // enunciations
  var hesitations = [];
  var enunciations = [];

  for (var i = 0; i < timestamps.length; i++) {
    if (timestamps[i][0].indexOf('%HESITATION') > -1 ) {
        hesitations.push(timestamps[i]);
    } else {
        enunciations.push(timestamps[i]);
    }
  }

  var result = {"pauses": gaps, "hesitations": hesitations, "wpm": wpm, "enunciations": enunciations, "text": sentence};
  res.send(result);
  console.log(result);
  next();
};

module.exports = processMetadata;

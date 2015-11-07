var processMetadata = function (req, res, next) {

  console.log('Received data!');
  console.log(req.body);
  var final_results = [];
  var gaps = [];
  for (var i = 0; i < req.body.length; i++) {
    var guess = req.body.data[i];
    if (guess.results[0].final) {
      final_results.push(guess.final_results[i][final_results[i].length][0].results[0].alternatives[0].timestamps);
    }
  }
  for (var i = 0; i < final_results.length - 1; i++) {
      gaps[i] = [final_results[i][final_results[i].length][0], 
            final_results[i+1][0][0], (final_results[i+1][0][1]-
            final_results[i][final_results[i].length][2])];
  }

  res.sendStatus(200);
  next();
};

module.exports = processMetadata;

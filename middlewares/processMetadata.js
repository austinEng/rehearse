var processMetadata = function (req, res, next) {
  console.log('Received data!');
  console.log(req.body);
  var final_results = [];
  for guess in req.body:
  	if(guess.results[0].final)
  		final_results.push(guess.rfinal_results[i][final_results[i].length][0]esults[0].alternatives[0].timestamps);
    var gaps 
    for (int i = 0; i<final_results.length-1; i++){
  		gaps[i] = [final_results[i][final_results[i].length][0], 
  					final_results[i+1][0][0], (final_results[i+1][0][1]-
  					final_results[i][final_results[i].length][2])];
  	}

};

module.exports = processMetadata;


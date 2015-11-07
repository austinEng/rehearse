"use strict"
var express = require('express');
var router = express.Router();
var NodeCache = require( "node-cache" );
var dataCache = new NodeCache();

var processMetadata = function (req, res, next) {
<<<<<<< HEAD
  console.log('Received data!');
  console.log(req.body);
  var final_results = [];
  var gaps = [];
  for (guess : req.body){
  	if(guess.results[0].final)
  		final_results.push(guess.rfinal_results[i][final_results[i].length][0]esults[0].alternatives[0].timestamps);
  }
  for (int i = 0; i<final_results.length-1; i++){
  		gaps[i] = [final_results[i][final_results[i].length][0], 
  					final_results[i+1][0][0], (final_results[i+1][0][1]-
  					final_results[i][final_results[i].length][2])];
  }
};

module.exports = processMetadata;

=======
  	console.log(req.body);

  	res.sendStatus(200);
};

router.post('/', function(req, res, next) {
	console.log('Received chunk ' + req.body.hash);
	if (req.body.finished==false) {		// request isn't finished yet!
	  	dataCache.get(req.body.hash, function (err, value) {
			if (err) {
				res.sendStatus(500);
			}
			if (typeof(value) === "undefined") {
				console.log("Initializing chunk " + req.body.hash);
				dataCache.set(req.body.hash, req.body, function (err, success) {
					if (err) {
						res.sendStatus(500);
					}
					res.sendStatus(200);
				});
			} else {
				console.log("Appending to chunk " + req.body.hash);
				value.data = value.data.concat(req.body.data);
				dataCache.set(req.body.hash, value, function (err, success) {
					if (err) {
						res.sendStatus(500);
					}
					res.sendStatus(200);
				});
			}
	  	});
  	} else {						// request has completed!
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
			return processMetadata(req, res, next);
		});
  	}
});

module.exports = router;
>>>>>>> origin/master

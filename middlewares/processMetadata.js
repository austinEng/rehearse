"use strict"
var express = require('express');
var router = express.Router();
var NodeCache = require( "node-cache" );
var dataCache = new NodeCache();

var processMetadata = function (req, res, next) {

  console.log('Received data!');
  console.log(req.body);
  var final_results = [];
  var gaps = [];
  for (var i = 0; i < req.body.length; i++) {
  	var guess = req.body.data[i];
  	if(guess.results[0].final)
  		final_results.push(guess.final_results[i][final_results[i].length][0].results[0].alternatives[0].timestamps);
  }
  for (var i = 0; i<final_results.length-1; i++){
  		gaps[i] = [final_results[i][final_results[i].length][0], 
  					final_results[i+1][0][0], (final_results[i+1][0][1]-
  					final_results[i][final_results[i].length][2])];
  }

  res.sendStatus(200);
};

router.post('/', function(req, res, next) {
	if (req.body.finished==false) {		// request isn't finished yet!
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
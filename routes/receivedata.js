"use strict"
var express = require('express');
var router = express.Router();

var analyzeTone = require('../middlewares/analyzeTone');
var saveSession = require('../middlewares/saveSession');

/*var processMetadata = require('../middlewares/processMetadata');
var processSpeech = require('../middlewares/processSpeech');


router.post('/', processSpeech, processMetadata, analyzeTone, saveSession);*/

router.post('/', function (req, res, next) {
	console.log(req.body);
	if (req.user) {
		req.user.sessions.push(req.body);
	}
	req.user.save(function(err) {
		if (err) throw err;
		res.sendStatus(200);
	});
});

router.get('/test', analyzeTone);

router.post('/', analyzeTone, saveSession);

module.exports = router;

"use strict"
var express = require('express');
var router = express.Router();

var processMetadata = require('../middlewares/processMetadata');
var analyzeTone = require('../middlewares/analyzeTone');
var processSpeech = require('../middlewares/processSpeech');
var saveSession = require('../middlewares/saveSession');

router.post('/', processSpeech, processMetadata, analyzeTone, saveSession);

module.exports = router;

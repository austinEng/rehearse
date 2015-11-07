"use strict"
var express = require('express');
var router = express.Router();

var processMetadata = require('../middlewares/processMetadata');
var analyzeTone = require('../middlewares/analyzeTone');
var processSpeech = require('../middlewares/processSpeech');

router.post('/', processSpeech, processMetadata, analyzeTone);

module.exports = router;

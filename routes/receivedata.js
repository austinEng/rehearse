"use strict"
var express = require('express');
var router = express.Router();

var processMetadata = require('../middlewares/processMetadata');
var analyzeTone = require('../middlewares/analyzeTone');
var processSpeech = require('../middlewares/processSpeech');
var saveSession = require('../middlewares/saveSession');

router.get('/test', analyzeTone);

router.post('/', analyzeTone, saveSession);

module.exports = router;

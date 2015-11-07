/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global $:false, BUFFERSIZE */

'use strict';

var utils = require('./utils');
utils.initPubSub();
var Recorder = require('./recorder');
var generatePrompt = require('./prompt').generatePrompt;

window.BUFFERSIZE = 8192;

$(document).ready(function() {
  var tokenGenerator = utils.createTokenGenerator();

  // Make call to API to try and get token
  tokenGenerator.getToken(function(err, token) {
    window.onbeforeunload = function() {
      localStorage.clear();
    };

    if (!token) {
      console.error('No authorization token available');
      console.error('Attempting to reconnect...');

      if (err && err.code)
        console.error('Server error ' + err.code + ': '+ err.error);
      else
        console.error('Server error ' + err.code + ': please refresh your browser and try again');
    }

    var context = {
      currentModel: 'en-US_BroadbandModel',
      token: token,
      bufferSize: BUFFERSIZE
    };

    $('#prompt').text(generatePrompt);

    Recorder.initRecorder(context);

  });

});

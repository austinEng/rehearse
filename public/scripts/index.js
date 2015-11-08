(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* global OfflineAudioContext */
'use strict';

var utils = require('./utils');
var createAudioMeter = require('./volume-meter').createAudioMeter;
/**
 * Captures microphone input from the browser.
 * Works at least on latest versions of Firefox and Chrome
 */
function Microphone(_options) {
  var options = _options || {};

  // we record in mono because the speech recognition service
  // does not support stereo.
  this.bufferSize = options.bufferSize || 8192;
  this.inputChannels = options.inputChannels || 1;
  this.outputChannels = options.outputChannels || 1;
  this.recording = false;
  this.requestedAccess = false;
  this.sampleRate = 16000;
  this.volumeRead = options.volumeRead;
  // auxiliar buffer to keep unused samples (used when doing downsampling)
  this.bufferUnusedSamples = new Float32Array(0);

  // Chrome or Firefox or IE User media
  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;
  }

}

/**
 * Called when the user reject the use of the michrophone
 * @param  error The error
 */
Microphone.prototype.onPermissionRejected = function() {
  console.log('Microphone.onPermissionRejected()');
  this.requestedAccess = false;
  this.onError('Permission to access the microphone rejeted.');
};

Microphone.prototype.onError = function(error) {
  console.log('Microphone.onError():', error);
};

/**
 * Called when the user authorizes the use of the microphone.
 * @param  {Object} stream The Stream to connect to
 *
 */
Microphone.prototype.onMediaStream =  function(stream) {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;

  if (!AudioCtx)
    throw new Error('AudioContext not available');

  if (!this.audioContext)
    this.audioContext = new AudioCtx();

  var gain = this.audioContext.createGain();
  var audioInput = this.audioContext.createMediaStreamSource(stream);

  audioInput.connect(gain);

  this.mic = this.audioContext.createScriptProcessor(this.bufferSize,
    this.inputChannels, this.outputChannels);

  // uncomment the following line if you want to use your microphone sample rate
  //this.sampleRate = this.audioContext.sampleRate;
  console.log('Microphone.onMediaStream(): sampling rate is:', this.sampleRate);

  this.mic.onaudioprocess = this._onaudioprocess.bind(this);
  this.stream = stream;

  gain.connect(this.mic);
  this.mic.connect(this.audioContext.destination);
  this.recording = true;
  this.requestedAccess = false;
  this.onStartRecording();

  this.meter = createAudioMeter(this.audioContext, 0.98, 0);
  audioInput.connect(this.meter);
};

/**
 * callback that is being used by the microphone
 * to send audio chunks.
 * @param  {object} data audio
 */
Microphone.prototype._onaudioprocess = function(data) {
  if (!this.recording) {
    // We speak but we are not recording
    return;
  }

  // Single channel
  var chan = data.inputBuffer.getChannelData(0);

  //resampler(this.audioContext.sampleRate,data.inputBuffer,this.onAudio);
  this.volumeRead(this.meter.volume);
  this.onAudio(this._exportDataBufferTo16Khz(new Float32Array(chan)));

  //export with microphone mhz, remember to update the this.sampleRate
  // with the sample rate from your microphone
  // this.onAudio(this._exportDataBuffer(new Float32Array(chan)));

};

/**
 * Start the audio recording
 */
Microphone.prototype.record = function() {
  if (!navigator.getUserMedia){
    this.onError('Browser doesn\'t support microphone input');
    return;
  }
  if (this.requestedAccess) {
    return;
  }

  this.requestedAccess = true;
  navigator.getUserMedia({ audio: true },
    this.onMediaStream.bind(this), // Microphone permission granted
    this.onPermissionRejected.bind(this)); // Microphone permission rejected
};

/**
 * Stop the audio recording
 */
Microphone.prototype.stop = function() {
  if (!this.recording)
    return;
  this.recording = false;
  this.stream.getTracks()[0].stop();
  this.requestedAccess = false;
  this.mic.disconnect(0);
  this.mic = null;
  this.onStopRecording();
};

/**
 * Creates a Blob type: 'audio/l16' with the chunk and downsampling to 16 kHz
 * coming from the microphone.
 * Explanation for the math: The raw values captured from the Web Audio API are
 * in 32-bit Floating Point, between -1 and 1 (per the specification).
 * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
 * Multiply to control the volume of the output. We store in little endian.
 * @param  {Object} buffer Microphone audio chunk
 * @return {Blob} 'audio/l16' chunk
 * @deprecated This method is depracated
 */
Microphone.prototype._exportDataBufferTo16Khz = function(bufferNewSamples) {
  var buffer = null,
    newSamples = bufferNewSamples.length,
    unusedSamples = this.bufferUnusedSamples.length;


  if (unusedSamples > 0) {
    buffer = new Float32Array(unusedSamples + newSamples);
    for (var i = 0; i < unusedSamples; ++i) {
      buffer[i] = this.bufferUnusedSamples[i];
    }
    for (i = 0; i < newSamples; ++i) {
      buffer[unusedSamples + i] = bufferNewSamples[i];
    }
  } else {
    buffer = bufferNewSamples;
  }

  // downsampling variables
  var filter = [
      -0.037935, -0.00089024, 0.040173, 0.019989, 0.0047792, -0.058675, -0.056487,
      -0.0040653, 0.14527, 0.26927, 0.33913, 0.26927, 0.14527, -0.0040653, -0.056487,
      -0.058675, 0.0047792, 0.019989, 0.040173, -0.00089024, -0.037935
    ],
    samplingRateRatio = this.audioContext.sampleRate / 16000,
    nOutputSamples = Math.floor((buffer.length - filter.length) / (samplingRateRatio)) + 1,
    pcmEncodedBuffer16k = new ArrayBuffer(nOutputSamples * 2),
    dataView16k = new DataView(pcmEncodedBuffer16k),
    index = 0,
    volume = 0x7FFF, //range from 0 to 0x7FFF to control the volume
    nOut = 0;

  for (var i = 0; i + filter.length - 1 < buffer.length; i = Math.round(samplingRateRatio * nOut)) {
    var sample = 0;
    for (var j = 0; j < filter.length; ++j) {
      sample += buffer[i + j] * filter[j];
    }
    sample *= volume;
    dataView16k.setInt16(index, sample, true); // 'true' -> means little endian
    index += 2;
    nOut++;
  }

  var indexSampleAfterLastUsed = Math.round(samplingRateRatio * nOut);
  var remaining = buffer.length - indexSampleAfterLastUsed;
  if (remaining > 0) {
    this.bufferUnusedSamples = new Float32Array(remaining);
    for (i = 0; i < remaining; ++i) {
      this.bufferUnusedSamples[i] = buffer[indexSampleAfterLastUsed + i];
    }
  } else {
    this.bufferUnusedSamples = new Float32Array(0);
  }

  return new Blob([dataView16k], {
    type: 'audio/l16'
  });
  };



// native way of resampling captured audio
var resampler = function(sampleRate, audioBuffer, callbackProcessAudio) {

  console.log('length: ' + audioBuffer.length + ' ' + sampleRate);
  var channels = 1;
  var targetSampleRate = 16000;
  var numSamplesTarget = audioBuffer.length * targetSampleRate / sampleRate;

  var offlineContext = new OfflineAudioContext(channels, numSamplesTarget, targetSampleRate);
  var bufferSource = offlineContext.createBufferSource();
  bufferSource.buffer = audioBuffer;

  // callback that is called when the resampling finishes
  offlineContext.oncomplete = function(event) {
    var samplesTarget = event.renderedBuffer.getChannelData(0);
    console.log('Done resampling: ' + samplesTarget.length + ' samples produced');

  // convert from [-1,1] range of floating point numbers to [-32767,32767] range of integers
  var index = 0;
  var volume = 0x7FFF;
    var pcmEncodedBuffer = new ArrayBuffer(samplesTarget.length*2);    // short integer to byte
    var dataView = new DataView(pcmEncodedBuffer);
    for (var i = 0; i < samplesTarget.length; i++) {
      dataView.setInt16(index, samplesTarget[i]*volume, true);
      index += 2;
    }

    // l16 is the MIME type for 16-bit PCM
    callbackProcessAudio(new Blob([dataView], { type: 'audio/l16' }));
  };

  bufferSource.connect(offlineContext.destination);
  bufferSource.start(0);
  offlineContext.startRendering();
};



/**
 * Creates a Blob type: 'audio/l16' with the
 * chunk coming from the microphone.
 */
var exportDataBuffer = function(buffer, bufferSize) {
  var pcmEncodedBuffer = null,
    dataView = null,
    index = 0,
    volume = 0x7FFF; //range from 0 to 0x7FFF to control the volume

  pcmEncodedBuffer = new ArrayBuffer(bufferSize * 2);
  dataView = new DataView(pcmEncodedBuffer);

  /* Explanation for the math: The raw values captured from the Web Audio API are
   * in 32-bit Floating Point, between -1 and 1 (per the specification).
   * The values for 16-bit PCM range between -32768 and +32767 (16-bit signed integer).
   * Multiply to control the volume of the output. We store in little endian.
   */
  for (var i = 0; i < buffer.length; i++) {
    dataView.setInt16(index, buffer[i] * volume, true);
    index += 2;
  }

  // l16 is the MIME type for 16-bit PCM
  return new Blob([dataView], { type: 'audio/l16' });
};

Microphone.prototype._exportDataBuffer = function(buffer){
  utils.exportDataBuffer(buffer, this.bufferSize);
};


// Functions used to control Microphone events listeners.
Microphone.prototype.onStartRecording =  function() {};
Microphone.prototype.onStopRecording =  function() {};
Microphone.prototype.onAudio =  function() {};

module.exports = Microphone;
},{"./utils":8,"./volume-meter":9}],2:[function(require,module,exports){
function Analysis() {
	this.minClarity = -1;
	this.maxClarity = -1;
	this.avgClarity = -1;
	this.clarityCount = 0;

	this.wpm = -1;
	this.wpmCount = 0;

	this.minSpacing = -1;
	this.maxSpacing = -1;
	this.avgSpacing = -1;
	this.spacingCount = 0;

	this.hesitations = -1;
	this.hesitationCount = 0;

	this.stack = [];

	this.lastDatum = null;
}

Analysis.prototype.pushData = function(data) {
	if (data.results[0].final) {
		var content = data.results[0].alternatives[0].transcript;
		var re = /^[^aeyiuo]+$/;
		if (content.indexOf('%HESITATION') != -1 || re.test(content)) {
			var t = data.results[0].alternatives[0].timestamps[0][2];
			this.hesitationCount++;
		}

		re = /^[^aeyiuo]*$/
		var segments = data.results[0].alternatives[0].transcript.split(" ");
		for (var i = 0; i < segments.length; i++) {
			if(!re.test(segments[i])) {
				this.wpmCount++;
			}
		}

		var clarity = this.avgClarity * this.clarityCount;
		clarity += data.results[0].alternatives[0].confidence;
		this.clarityCount++;
		this.avgClarity = clarity / this.clarityCount;

		var t = data.results[0].alternatives[0].timestamps[0];
		if (t) {
			this.hesitations = this.hesitationCount / t[2];
			this.wpm = this.wpmCount * 60 / t[2];
		}

	}

	if (!this.lastDatum && data.results[0].alternatives[0].timestamps.length <= 1) {
		this.lastDatum = data;
		return;
	}

	var times;
	if (this.lastDatum) {
		var times1 = this.lastDatum.results[0].alternatives[0].timestamps;
		var times2 = data.results[0].alternatives[0].timestamps;
		times = times1.concat(times2);
	} else {
		times = data.results[0].alternatives[0].timestamps;
	}
	if (times.length > 1) {
		for (var i = 0; i < times.length - 1; i++) {
			var t1 = times[i];
			var t2 = times[i+1];

			if (this.spacingCount == 0) {
				if (t2[1] - t1[2] > 0) {
					this.avgSpacing = t2[1] - t1[2];
					this.spacingCount++;
				}		
			} else {
				var spacing = this.avgSpacing * this.spacingCount;
				if (t2[1] - t1[2] > 0) {
					spacing += t2[1] - t1[2];
				}
				this.spacingCount++;
				this.avgSpacing = spacing / this.spacingCount;
			}
		}
	}
	this.lastDatum = data;
	this.stack.push(data);
}

Analysis.prototype.popData = function(cb) {
	var data = this.stack.pop();
	this.lastDatum = this.stack[this.stack.length - 1];
	var times = data.results[0].alternatives[0].timestamps;
	if (times.length > 1) {
		for (var i = 0; i < times.length - 1; i++) {
			var t1 = times[i];
			var t2 = times[i+1];
			var spacing = this.avgSpacing * this.spacingCount;
			if (t2[1] - t1[2] > 0) {
				spacing -= t2[1] - t1[2];
			}
			this.spacingCount--;
			this.avgSpacing = spacing / this.spacingCount;
		}
	}
}

Analysis.prototype.popNonFinal = function(cb) {
	if (this.stack.length > 0) {
		var datum = this.stack[this.stack.length - 1];
		while (datum && !datum.results[0].final && this.stack.length > 0) {
			this.popData();
			datum = this.stack[this.stack.length - 1];
		}
		cb();
	}
	return cb();
}

Analysis.prototype.readData = function(data, cb) {
	if (data.results[0].final) {
		this.pushData(data);
		cb();
	}
	/*console.log(this.stack.length);
	if (data.results[0].final) {
		var that = this;
		this.popNonFinal(function() {
			that.pushData(data);
		});
	} else {
		var that = this;
		this.popNonFinal(function() {
			that.pushData(data);
		});
		//this.pushData(data);
	}
	cb();*/
}


module.exports = Analysis;
},{}],3:[function(require,module,exports){
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
  $('#prompt').text(generatePrompt);

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

    Recorder.initRecorder(context);

  });

});

},{"./prompt":4,"./recorder":6,"./utils":8}],4:[function(require,module,exports){
var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.generatePrompt = function () {
  var prompts = ['Tell me about yourself.', 'Tell me about a recent project you\'ve worked on.',
  'Do you prefer to work in a team or alone? Why?', 'Describe a recent programming challenge you encountered and how you dealt with it.',
  'What is your biggest weakness?'];
  return prompts[getRandomInt(0, prompts.length - 1)];
};

},{}],5:[function(require,module,exports){

exports.activate = function () {
	$('#recordButton').removeClass('inactive').addClass('active');
	$('#recordButton .text').text('Stop');
}

exports.deactivate = function () {
	$('#recordButton').removeClass('active').addClass('inactive');
	$('#recordButtonAnimWrap').css('padding', '');
	$('#recordButton .text').text('Record');
}

exports.setVolume = function (vol) {
	$('#recordButtonAnimWrap').css('padding', vol/2 + '%');
}
},{}],6:[function(require,module,exports){
var Microphone = require('./Microphone');
var initSocket = require('./socket').initSocket;
var button = require('./recordbutton');

var Analysis = require('./analysis');

exports.initRecorder = function(ctx) {
	var recordButton = $('#recordButton');

	var volumeRead = function(volume) {
		button.setVolume(80*(1 - Math.sqrt(Math.sqrt(volume))));
	};

	recordButton.click((function() {
		var running = false;
	    var token = ctx.token;
	    var micOptions = {
	    	bufferSize: ctx.buffersize,
	    	volumeRead: volumeRead
	    };
	    var mic = new Microphone(micOptions);

	    return function(evt) {
	    	if (!running) {
	    		console.log("Initializing recorder");
	    		initializeRecording(token, mic, function(err) {
	    			if (err) {
	    				console.log("Couldn't start recorder");
	    				console.log('Error: ' + err.message);
	    				running = false;
	    				button.deactivate();
	    			} else {
	    				console.log("Starting record");
			    		mic.record();
			    		running = true;
			    		button.activate();
	    			}
	    		});
	    	} else {
	    		console.log("Stopping record");
	    		$.publish('hardsocketstop');
	    		mic.stop();
	    		running = false;
	    		button.deactivate();
	    	}
	    }
	})());
}

var initializeRecording = function(token, mic, callback) {
	var options = {};
	options.token = token;
	options.message = {
		'action': 'start',
		'content-type': 'audio/l16;rate=16000',
		'interim_results': true,
		'continuous': true,
		'word_confidence': true,
		'timestamps': true,
		'max_alternatives': 3,
		'inactivity_timeout': 600
	};
	options.model = 'en-US_BroadbandModel';

	var results = [];
	var hash = Math.random().toString(36).substring(2);
	var analyzer = new Analysis();

	function onOpen(socket) {
	    console.log('Mic socket: opened');
	    callback(null, socket);
	}

	function onListening(socket) {

	    mic.onAudio = function(blob) {
	    	if (socket.readyState < 2) {
	        	socket.send(blob);
	    	}
	    };
	}

	function onMessage(msg) {
	    if (msg.results) {
	    	console.log(msg.results[0].alternatives[0].transcript);
	    	results.push(msg);
	    	analyzer.readData(msg, function() {
	    		var spacing = Math.round(1000*analyzer.avgSpacing)/1000;
	    		if (spacing < 0) { spacing = "---"; }
	    		$('#spacing').text(spacing);

	    		var hesitation = Math.round(1000*analyzer.hesitations)/1000;
	    		if (hesitation < 0) { hesitation = '---'; }
	    		$('#hesitation').text(hesitation);

	    		var wpm = Math.round(10*analyzer.wpm)/10;
	    		if (wpm < 0) { wpm = '---'; }
	    		$('#wpm').text(wpm);

	    		var clarity = Math.round(10*analyzer.avgClarity)/10;
	    		if (clarity < 0) { clarity = '---'; }
	    		$('#clarity').text(clarity);
	    	});

	    	if (results.length > 10) {
	    		var json = { 
		    		hash: hash,
		    		data: results,
		    		finished: false
		    	};
	    		$.ajax({
			    	type: "POST",
			    	url: "/receivedata",
			    	async: true,
			    	dataType: 'json',
			    	contentType: 'application/json',
			    	data: JSON.stringify(json),
			    	success: function(data) {
			    		results = [];
			    	}
			    });
	    	}
	    }
	}

	function onError() {
	    console.log('Mic socket err: ', err);
	}

	function onClose(evt) {
	    console.log(results);
	    var json = { 
    		hash: hash,
    		data: results,
    		finished: true
    	};
	    $.ajax({
	    	type: "POST",
	    	url: "/receivedata",
	    	dataType: 'json',
	    	contentType: 'application/json',
	    	data: JSON.stringify(json),
	    	success: function(data) {
    			console.log(data);
	    	}
	    });
	    console.log('Mic socket close: ', evt);
	}

	initSocket(options, onOpen, onListening, onMessage, onError, onClose);
}
},{"./Microphone":1,"./analysis":2,"./recordbutton":5,"./socket":7}],7:[function(require,module,exports){
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
/*global $:false */

'use strict';

var utils = require('./utils');

// Mini WS callback API, so we can initialize
// with model and token in URI, plus
// start message

// Initialize closure, which holds maximum getToken call count
var tokenGenerator = utils.createTokenGenerator();

var initSocket = exports.initSocket = function(options, onopen, onlistening, onmessage, onerror, onclose) {
  var listening;
  function withDefault(val, defaultVal) {
    return typeof val === 'undefined' ? defaultVal : val;
  }
  var socket;
  var token = options.token;
  var model = options.model || localStorage.getItem('currentModel');
  var message = options.message || {'action': 'start'};
  var sessionPermissions = withDefault(options.sessionPermissions,
    JSON.parse(localStorage.getItem('sessionPermissions')));
  var sessionPermissionsQueryParam = sessionPermissions ? '0' : '1';
  var url = options.serviceURI || 'wss://stream.watsonplatform.net/speech-to-text/api/v1/recognize?watson-token=';
    url+= token + '&X-WDC-PL-OPT-OUT=' + sessionPermissionsQueryParam + '&model=' + model;
  console.log('URL model', model);
  try {
    socket = new WebSocket(url);
  } catch(err) {
    console.error('WS connection error: ', err);
  }
  socket.onopen = function() {
    listening = false;
    $.subscribe('hardsocketstop', function() {
      console.log('MICROPHONE: close.');
      socket.send(JSON.stringify({action:'stop'}));
      socket.close();
    });
    $.subscribe('socketstop', function() {
      console.log('MICROPHONE: close.');
      socket.close();
    });
    socket.send(JSON.stringify(message));
    onopen(socket);
  };
  socket.onmessage = function(evt) {
    var msg = JSON.parse(evt.data);
    if (msg.error) {
      console.error(msg.error);
      $.publish('hardsocketstop');
      return;
    }
    if (msg.state === 'listening') {
      // Early cut off, without notification
      if (!listening) {
        onlistening(socket);
        listening = true;
      } else {
        console.log('MICROPHONE: Closing socket.');
        socket.close();
      }
    }
    onmessage(msg, socket);
  };

  socket.onerror = function(evt) {
    console.log('WS onerror: ', evt);
    console.error('Application error ' + evt.code + ': please refresh your browser and try again');
    $.publish('clearscreen');
    onerror(evt);
  };

  socket.onclose = function(evt) {
    console.log('WS onclose: ', evt);
    if (evt.code === 1006) {
      // Authentication error, try to reconnect
      console.log('generator count', tokenGenerator.getCount());
      if (tokenGenerator.getCount() > 1) {
        $.publish('hardsocketstop');
        throw new Error('No authorization token is currently available');
      }
      tokenGenerator.getToken(function(err, token) {
        if (err) {
          $.publish('hardsocketstop');
          return false;
        }
        console.log('Fetching additional token...');
        options.token = token;
        initSocket(options, onopen, onlistening, onmessage, onerror, onclose);
      });
      return false;
    }
    if (evt.code === 1011) {
      console.error('Server error ' + evt.code + ': please refresh your browser and try again');
      return false;
    }
    if (evt.code > 1000) {
      console.error('Server error ' + evt.code + ': please refresh your browser and try again');
      return false;
    }
    // Made it through, normal close
    $.unsubscribe('hardsocketstop');
    $.unsubscribe('socketstop');
    onclose(evt);
  };

};

},{"./utils":8}],8:[function(require,module,exports){
(function (global){
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

'use strict';

// For non-view logic
var $ = (typeof window !== "undefined" ? window['jQuery'] : typeof global !== "undefined" ? global['jQuery'] : null);

exports.createTokenGenerator = function() {
  // Make call to API to try and get token
  var hasBeenRunTimes = 0;
  return {
    getToken: function(callback) {
      ++hasBeenRunTimes;
      if (hasBeenRunTimes > 5) {
        var err = new Error('Cannot reach server');
        callback(null, err);
        return;
      }
      var url = '/api/token';
      var tokenRequest = new XMLHttpRequest();
      tokenRequest.open('POST', url, true);
      tokenRequest.setRequestHeader('csrf-token',$('meta[name="ct"]').attr('content'));
      tokenRequest.onreadystatechange = function() {
        if (tokenRequest.readyState === 4) {
          if (tokenRequest.status === 200) {
            var token = tokenRequest.responseText;
            callback(null, token);
          } else {
            var error = 'Cannot reach server';
            if (tokenRequest.responseText){
              try {
                error = JSON.parse(tokenRequest.responseText);
              } catch (e) {
                error = tokenRequest.responseText;
              }
            }
            callback(error);
          }
        }
      };
      tokenRequest.send();
    },
    getCount: function() { return hasBeenRunTimes; }
  };
};

exports.initPubSub = function() {
  var o         = $({});
  $.subscribe   = o.on.bind(o);
  $.unsubscribe = o.off.bind(o);
  $.publish     = o.trigger.bind(o);
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) 2014 Chris Wilson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*

Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);

audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.

Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

var volumeAudioProcess = function( event ) {
	var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
	var sum = 0;
    var x;

	// Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}
    	sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*this.averaging);
}

exports.createAudioMeter = function(audioContext,clipLevel,averaging,clipLag) {
	var processor = audioContext.createScriptProcessor(512);
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;

	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);

	processor.checkClipping =
		function(){
			if (!this.clipping)
				return false;
			if ((this.lastClip + this.clipLag) < window.performance.now())
				this.clipping = false;
			return this.clipping;
		};

	processor.shutdown =
		function(){
			this.disconnect();
			this.onaudioprocess = null;
		};

	return processor;
}
},{}]},{},[3]);

var Microphone = require('./Microphone');
var initSocket = require('./socket').initSocket;

exports.initRecorder = function(ctx) {
	var recordButton = $('#recordButton');

	recordButton.click((function() {
		var running = false;
	    var token = ctx.token;
	    var micOptions = {
	    	bufferSize: ctx.buffersize
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
	    			} else {
	    				console.log("Starting record");
			    		mic.record();
			    		running = true;
	    			}
	    		});
	    	} else {
	    		console.log("Stopping record");
	    		$.publish('hardsocketstop');
	    		mic.stop();
	    		running = false;
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
	    }
	}

	function onError() {
	    console.log('Mic socket err: ', err);
	}

	function onClose(evt) {
	    console.log(results);
	    $.ajax({
	    	type: "POST",
	    	url: "/receivedata",
	    	data: { data: results }
	    });
	    console.log('Mic socket close: ', evt);
	}

	initSocket(options, onOpen, onListening, onMessage, onError, onClose);
}
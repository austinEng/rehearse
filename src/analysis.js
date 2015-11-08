function Analysis() {
	this.data = {};
	this.data.minClarity = -1;
	this.data.maxClarity = -1;
	this.data.avgClarity = -1;
	this.data.clarityCount = 0;

	this.data.wpm = -1;
	this.data.wpmCount = 0;

	this.data.minSpacing = -1;
	this.data.maxSpacing = -1;
	this.data.avgSpacing = -1;
	this.data.spacingCount = 0;

	this.data.hesitations = -1;
	this.data.hesitationCount = 0;

	this.stack = [];

	this.lastDatum = null;
}

Analysis.prototype.pushData = function(data) {
	if (data.results[0].final) {
		var content = data.results[0].alternatives[0].transcript;
		var re = /^[^aeyiuo]+$/;
		if (content.indexOf('%HESITATION') != -1 || re.test(content)) {
			var t = data.results[0].alternatives[0].timestamps[0][2];
			this.data.hesitationCount++;
		}

		re = /^[^aeyiuo]*$/
		var segments = data.results[0].alternatives[0].transcript.split(" ");
		for (var i = 0; i < segments.length; i++) {
			if(!re.test(segments[i])) {
				this.data.wpmCount++;
			}
		}

		var clarity = this.data.avgClarity * this.data.clarityCount;
		clarity += data.results[0].alternatives[0].confidence;
		this.data.clarityCount++;
		this.data.avgClarity = clarity / this.data.clarityCount;

		var t = data.results[0].alternatives[0].timestamps[0];
		if (t) {
			this.data.hesitations = this.data.hesitationCount;// / t[2];
			this.data.wpm = this.data.wpmCount * 60 / t[2];
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

			if (this.data.spacingCount == 0) {
				if (t2[1] - t1[2] > 0) {
					this.data.avgSpacing = t2[1] - t1[2];
					this.data.spacingCount++;
				}		
			} else {
				var spacing = this.data.avgSpacing * this.data.spacingCount;
				if (t2[1] - t1[2] > 0) {
					spacing += t2[1] - t1[2];
				}
				this.data.spacingCount++;
				this.data.avgSpacing = spacing / this.data.spacingCount;
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
			var spacing = this.data.avgSpacing * this.data.spacingCount;
			if (t2[1] - t1[2] > 0) {
				spacing -= t2[1] - t1[2];
			}
			this.data.spacingCount--;
			this.data.avgSpacing = spacing / this.data.spacingCount;
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
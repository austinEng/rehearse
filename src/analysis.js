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
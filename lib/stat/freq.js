"use strict";
var Freq = function (frameSize) {
	this.frameSize = (frameSize == null ? 10 * 1000 : frameSize);

	this.counts = {};
	this.lastCounts = {};
	this.prevTime = null;
	this.lastTime = null;

	this.intervalRef = null;
};

Freq.prototype.update = function (key) {
	if (this.intervalRef != null)
	{
		var count = this.counts[key];
		if (count == null)
		{
			count = 0;
		}
		this.counts[key] = count + 1;
	}
};

Freq.prototype.getCount = function (key) {
	var count = this.lastCounts[key];
	return count == null ? 0 : count;
};

// WARN opt_per must not be greater than frameSize
// else freq becomes useless
Freq.prototype.getFreq = function (key, opt_per) {
	var result = 0;
	if (this.lastTime != null && this.prevTime != null && this.prevTime < this.lastTime)
	{
		var count = this.getCount(key);
		if (count > 0)
		{
			var per = opt_per || 1000;
			result = count * per / (this.lastTime - this.prevTime);
		}
	}
	return result;
};

Freq.prototype.getFreqNorm = function (key, opt_per) {
	var result = this.getFreq(key, opt_per);
	result = Math.round(result * 100) / 100;
	return result;
};

Freq.prototype.onFrame = function () {
	this.lastCounts = this.counts;
	this.counts = {};
	this.prevTime = this.lastTime;
	this.lastTime = Date.now();
};

Freq.prototype.start = function () {
	if (this.intervalRef == null)
	{
		this.lastTime = Date.now();
		this.counts = {};
		var self = this;
		this.intervalRef = setInterval(function () {
			self.onFrame();
		}, this.frameSize);
	}
};

Freq.prototype.stop = function () {
	if (this.intervalRef != null)
	{
		clearInterval(this.intervalRef);
	}
};

module.exports = Freq;

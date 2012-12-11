"use strict";

var TimedChecker = function (checkFunc, checkInterval) {
	this.checkFunc = checkFunc;
	this.checkInterval = checkInterval;

	this.items = {};
	this.itemCount = 0;
	this.checkIntervalId = null;
};

TimedChecker.prototype.add = function (k) {
	this.items[k] = null;
	this.itemCount++;
	var self = this;
	if (this.checkIntervalId == null) {
		this.checkIntervalId = setInterval(function () {
			self.checkFunc();
		}, this.checkInterval);
	}
};

TimedChecker.prototype.remove = function (k) {
	delete this.items[k];
	this.itemCount--;
	if (this.itemCount === 0 && this.checkTimeout != null) {
		clearInterval(this.checkIntervalId);
		this.checkIntervalId = null;
	}
};


module.exports = TimedChecker;

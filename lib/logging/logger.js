"use strict";
var Logger = function (name, settings) {
	this.name = name;
	settings = settings || {};
	this.logLevel = settings.logLevel || 'error';
	this.priority = this.getPriority(this.logLevel);
	this.handleError = this.createHanldeErrorFunc();
};

Logger.prototype.logLevelPriority = {
	all: 0,
	debug: 10,
	info: 20,
	warning: 30,
	error: 40,
	critical: 50,
	none: 100
};
Logger.prototype.logLevelErrBoundary = 25;

Logger.prototype.getPriority = function (logLevel) {
	if (logLevel == null) {
		return null;
	}
	var result = this.logLevelPriority[logLevel];
	if (result == null) {
		this.logError(new Error('Unknown logLevel ' + logLevel), 'critical');
	}
	return result;
};

Logger.prototype.minLevel = function () {
	var result = null;
	var resultPriority = null;
	var isSet = false;
	for (var i = 0; i < arguments.length; i++) {
		var level = arguments[i];
		var priority = this.getPriority(level);
		if (!isSet || priority == null || priority < resultPriority) {
			result = level;
			if (result == null) {
				break;
			}
			resultPriority = priority;
		}
	}
	return result;
};

Logger.prototype.isEnabledFor = function (logLevel) {
	var priority = this.getPriority(logLevel);
	return priority == null || this.priority == null || priority >= this.priority;
};

Logger.prototype.log = function (logLevel, msg) {
	if (this.isEnabledFor(logLevel)) {
		this.logInternal(logLevel, msg);
	}
};

Logger.prototype.critical = function (msg) {
	this.log('critical', msg);
};

Logger.prototype.error = function (msg) {
	this.log('error', msg);
};

Logger.prototype.warning = function (msg) {
	this.log('warning', msg);
};

Logger.prototype.info = function (msg) {
	this.log('info', msg);
};

Logger.prototype.debug = function (msg) {
	this.log('debug', msg);
};

Logger.prototype.logInternal = function (logLevel, msg) {
	// TODO allow log to files
	msg = this.getMessage(logLevel, msg);
	if (this.getPriority(logLevel) >= this.logLevelErrBoundary) {
		console.error(msg);
	}
	else {
		console.log(msg);
	}
};

Logger.prototype.getMessage = function (logLevel, msg) {
	var items = ['-- ', new Date().toISOString(), ' ', this.name];
	if (logLevel) {
		items.push(' ');
		items.push(logLevel.toUpperCase());
	}
	items.push(' --\n');
	items.push(msg);
	items.push('\n');
	return items.join('');
};

Logger.prototype.createHanldeErrorFunc = function () {
	var self = this;
	return function (err) {
		if (err != null) {
			self.logError(err);
		}
	};
};

Logger.prototype.logError = function (err, opt_logLevel) {
	var logLevel = logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		this.logInternal(logLevel, this.getErrorMessage(err));
	}
};

Logger.prototype.getErrorMessage = function (err) {
	return err.stack || err.toString();
};


module.exports = Logger;

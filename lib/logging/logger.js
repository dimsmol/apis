"use strict";
var util = require('util');


var Logger = function (logging, name, opt_settings) {
	this.logging = logging;
	this.name = name;
	this.settings = opt_settings || {};

	this.logLevel = this.settings.logLevel;
	this.priority = this.getPriority(this.logLevel);

	this.sendTo = this.getSendTo();
	this.engine = this.getEngine();

	this.handleError = this.createHanldeErrorFunc();
};

Logger.prototype.getSendTo = function () {
	var sendTo = this.settings.sendTo;
	if (sendTo == null) {
		sendTo = [this.logging.rootLogger];
	}
	else if (sendTo.length === 0) {
		sendTo = null;
	}
	return sendTo;
};

Logger.prototype.getEngine = function () {
	return this.logging.getEngine(this.name, this.settings.engine);
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
	return this.logLevelPriority[logLevel];
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

Logger.prototype.log = function (logLevel, msg, opt_srcName) {
	logLevel = logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		this.logInternal(logLevel, msg, opt_srcName);
	}
};

Logger.prototype.crit = Logger.prototype.critical = function (msg) {
	this.log('critical', msg);
};

Logger.prototype.error = function (msg) {
	this.log('error', msg);
};

Logger.prototype.warn = Logger.prototype.warning = function (msg) {
	this.log('warning', msg);
};

Logger.prototype.info = function (msg) {
	this.log('info', msg);
};

Logger.prototype.debug = function (msg) {
	this.log('debug', msg);
};

Logger.prototype.send = function (logLevel, msg, opt_srcName) {
	if (this.sendTo != null) {
		var name = opt_srcName || this.name;
		for (var i = 0; i < this.sendTo.length; i++) {
			var dst = this.sendTo[i];
			this.logging.getLogger(dst).log(logLevel, msg, name);
		}
	}
};

Logger.prototype.logInternal = function (logLevel, msg, opt_srcName) {
	this.logToEngine(logLevel, msg, opt_srcName);
	this.send(logLevel, msg, opt_srcName);
};

Logger.prototype.logToEngine = function (logLevel, msg, opt_srcName) {
	if (this.engine != null) {
		this.engine.log(this, logLevel, msg, opt_srcName);
	}
};

Logger.prototype.createHanldeErrorFunc = function () {
	var self = this;
	return function (err) {
		if (err != null) {
			self.logError(err);
		}
	};
};

Logger.prototype.logError = function (err, opt_logLevel, opt_options) {
	var logLevel = logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		this.logInternal(logLevel, this.getErrorMessage(err, opt_options));
	}
};

Logger.prototype.getErrorMessage = function (err, opt_options) {
	var result;
	if (err != null) {
		if (err.constructor === String) {
			result = err;
		}
		else if (err.constructor === Object) {
			result = util.inspect(err);
		}
		else {
			result = err.stack || err.toString();
		}
	}
	if (opt_options && opt_options.prefix) {
		result = opt_options.prefix + result;
	}
	return result;
};


module.exports = Logger;

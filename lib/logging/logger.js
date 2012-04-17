"use strict";
var util = require('util');


var Logger = function (name, settings) {
	this.name = name || 'root';
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
	critical: 50
};

Logger.prototype.logLevelErrPriority = 25;

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
		if (err != null)
		{
			self.logError(err);
		}
	};
};

Logger.prototype.logError = function (err, logLevel) {
	logLevel = logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		this.logErrorInternal(err, logLevel);
	}
};

Logger.prototype.logErrorInternal = function (err, logLevel) {
	if (err != null) {
		var stack = err.stack;
		if (stack) {
			this.logInternal(logLevel, stack);
		}
		else {
			this.badError(err);
		}
	}
};

Logger.prototype.badError = function (err) {
	var msg = 'Invalid error';
	if (err instanceof WebError) {
		msg = 'Invalid WebError instance cought';
	}
	msg = [msg, util.inspect(err)].join(': ');
	this.logError(new Error(msg), 'critical');
};


module.exports = Logger;

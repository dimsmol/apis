"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var WebLogger = require('./web_logger');


var Logging = function () {
	this.settings = null;
	this.loggers = {};
};
inherits(Logging, Unit);

Logging.prototype.unitInit = function (units) {
	var settings = units.require('core.settings');
	this.settings = settings.core.logging || {};
};

Logging.prototype.getLogger = function (name) {
	name = name || 'root';
	var result = this.loggers[name];
	if (result == null) {
		this.loggers[name] = result = this.createLogger(name);
	}
	return result;
};

Logging.prototype.getLoggerSettings = function (name) {
	var result;
	if (this.settings != null) {
		var loggersSettings = this.settings.loggers;
		if (loggersSettings != null) {
			result = loggersSettings[name];
		}
	}
	return result;
};

Logging.prototype.createLogger = function (name) {
	var loggerSettings = this.getLoggerSettings(name);
	var LoggerClass = WebLogger;
	if (loggerSettings != null && loggerSettings.loggerClass != null) {
		LoggerClass = loggerSettings.loggerClass;
	}
	return new LoggerClass(name, loggerSettings);
};


module.exports = Logging;

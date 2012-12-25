"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var WebLogger = require('./web_logger');


var Logging = function () {
	this.settings = null;
	this.units = null;

	this.loggingProblems = [];
	this.hasFallbackLoggerEngineProblem = false;
	this.hasDefaultLoggerEngineProblem = false;

	this.loggers = {};
};
inherits(Logging, Unit);

Logging.prototype.loggingLoggerName = 'logging';

Logging.prototype.unitIsInitRequired = true;

Logging.prototype.unitInit = function (units) {
	this.units = units;
	var settings = units.require('core.settings');
	this.settings = settings.core.logging || {};
};

Logging.prototype.getLogger = function (name) {
	name = name || 'root';
	var result = this.loggers[name];
	if (result == null) {
		this.loggers[name] = result = this.createLogger(name);
	}
	if (name == this.loggingLoggerName) {
		this.reportCollectedLoggingProblems(result);
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
	return result || {};
};

Logging.prototype.getFallbackLoggerEngine = function (name, opt_engineUnitName) {
	var result;
	if (!this.hasFallbackLoggerEngineProblem) {
		var unitName = this.settings.fallbackEngine;
		if (unitName && opt_engineUnitName != unitName) {
			result = this.units.get(unitName);
			if (result == null) {
				this.hasFallbackLoggerEngineProblem = true;
				var msg = ['Fallback engine ', unitName, ' could not be found'].join('');
				if (name != this.loggingLoggerName) {
					this.reportLoggingProblem(msg);
				}
				else {
					this.loggingProblems.push(msg);
				}
			}
		}
	}
	return result;
};

Logging.prototype.getLoggerEngine = function (name, opt_engineUnitName) {
	var defaultUnitName = this.settings.defaultEngine;
	var isDefault = !opt_engineUnitName;
	var unitName = opt_engineUnitName || defaultUnitName;
	var result;
	if (unitName) {
		result = this.units.get(unitName);
		if (result == null) {
			if (!isDefault || !this.hasDefaultLoggerEngineProblem) {
				var msg;
				if (isDefault) {
					this.hasDefaultLoggerEngineProblem = true;
					msg = ['Default engine ', unitName, ' could not be found'].join('');
				}
				else {
					msg = [unitName, ' required by ', name, ' could not be found'].join('');
				}
				if (name != this.loggingLoggerName) {
					this.reportLoggingProblem(msg);
				}
				else {
					this.loggingProblems.push(msg);
				}
			}
			result = this.getFallbackLoggerEngine(name, unitName);
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
	var engine = this.getLoggerEngine(name, loggerSettings.engine);
	var result = new LoggerClass(name, loggerSettings, engine);
	return result;
};

Logging.prototype.reportCollectedLoggingProblems = function (logger) {
	if (this.loggingProblems.length > 0) {
		var problems = this.loggingProblems;
		this.loggingProblems = [];
		for (var i = 0; i < problems.length; i++) {
			this.reportLoggingProblem(problems[i], logger);
		}
	}
};

Logging.prototype.reportLoggingProblem = function (msg, opt_logger) {
	var logger = opt_logger || this.getLogger(this.loggingLoggerName);
	logger.critical(msg);
};


module.exports = Logging;

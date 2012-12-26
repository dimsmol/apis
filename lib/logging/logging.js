"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var WebLogger = require('./web_logger');


var Logging = function () {
	this.units = null;
	this.settings = null;
	this.rootLogger = null;

	this.loggingProblems = [];
	this.hasRootLoggerEngineProblem = false;

	this.loggers = {};
};
inherits(Logging, Unit);

Logging.prototype.loggingLoggerName = 'logging';

Logging.prototype.unitIsInitRequired = true;

Logging.prototype.unitInit = function (units) {
	this.units = units;
	var settings = units.require('core.settings');
	this.settings = settings.core.logging || {};
	this.rootLogger = this.settings.rootLogger;
};

Logging.prototype.getLogger = function (name) {
	name = name || this.rootLogger;
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

Logging.prototype.getEngine = function (loggerName, engineInfo) {
	var result;
	if (engineInfo != null) {
		var unitName = engineInfo.unit;
		if (unitName) {
			var isRoot = (loggerName == this.settings.rootLogger);
			var unit = this.units.get(unitName);
			if (unit == null) {
				if (!isRoot || !this.hasRootLoggerEngineProblem) {
					if (isRoot) {
						this.hasRootLoggerEngineProblem = true;
					}
					var msg = [unitName, ' required by logger "', loggerName, '" could not be found'].join('');
					if (loggerName != this.loggingLoggerName) {
						this.reportLoggingProblem(msg);
					}
					else {
						this.loggingProblems.push(msg);
					}
				}
			}
			else {
				result = unit.createInstance(engineInfo.settings);
			}
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
	return new LoggerClass(this, name, loggerSettings);
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

"use strict";
var inherits = require('util').inherits;
var SysLogger = require('ain2');
var Unit = require('units').Unit;


var Syslog = function () {
	this.logger = this.createLogger();
	this.settings = null;
};
inherits(Syslog, Unit);

Syslog.prototype.logLevelToSeverityDict = {
	'emerg': 'emerg', // no logLevel equivalent actually
	'alert': 'alert', // no logLevel equivalent actually
	'critical': 'crit',
	'error': 'err',
	'warning': 'warn',
	'notice': 'notice', // no logLevel equivalent actually
	'info': 'info',
	'debug': 'debug',
	'all': 'debug'
};

Syslog.prototype.unitInit = function (units) {
	this.settings = units.require('core.settings').core.logging.engines.syslog;
	this.setup();
};

Syslog.prototype.createLogger = function () {
	return new SysLogger();
};

Syslog.prototype.setup = function () {
	this.logger.set(this.settings);
};


Syslog.prototype.getSeverity = function (logLevel) {
	return this.logLevelToSeverityDict[logLevel];
};

Syslog.prototype.log = function (logger, logLevel, msg) {
	var severity = this.getSeverity(logLevel);
	this.logger.send(msg, severity);
};


module.exports = Syslog;

"use strict";
var inherits = require('util').inherits;
var SysLogger = require('ain2');
var Unit = require('units').Unit;


var Syslog = function () {
	this.logger = null;
};
inherits(Syslog, Unit);

Syslog.prototype.unitIsInitRequired = true;

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

Syslog.prototype.createInstance = function (opt_settings) {
	var result = new Syslog();
	result.logger = this.createLogger();
	result.setup(opt_settings);
	return result;
};

Syslog.prototype.createLogger = function () {
	return new SysLogger();
};

Syslog.prototype.setup = function (opt_settings) {
	this.logger.set(opt_settings);
};

Syslog.prototype.getSeverity = function (logLevel) {
	return this.logLevelToSeverityDict[logLevel] || 'err';
};

Syslog.prototype.log = function (logger, logLevel, msg, opt_srcName) {
	var severity = this.getSeverity(logLevel);
	msg = this.createMessage(logger, logLevel, severity, msg, opt_srcName);
	this.logger.send(msg, severity);
};

Syslog.prototype.createMessage = function (logger, logLevel, severity, msg, opt_srcName) {
	var name = opt_srcName || logger.name;
	return ['[ ', name, ' ', logLevel, ' ] ', msg].join('');
};


module.exports = Syslog;

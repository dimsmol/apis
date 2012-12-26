"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;


var Console = function () {
};
inherits(Console, Unit);

Console.prototype.unitIsInitRequired = true;

Console.prototype.createInstance = function (opt_settings) {
	return this;
};

Console.prototype.log = function (logger, logLevel, msg, opt_srcName) {
	msg = this.createMessage(logger, logLevel, msg, opt_srcName);
	if (logger.getPriority(logLevel) >= logger.logLevelErrBoundary) {
		console.error(msg);
	}
	else {
		console.log(msg);
	}
};

Console.prototype.createMessage = function (logger, logLevel, msg, opt_srcName) {
	var name = opt_srcName || this.name;
	var items = ['-- ', new Date().toISOString(), ' ', name];
	if (logLevel) {
		items.push(' ');
		items.push(logLevel.toUpperCase());
	}
	items.push(' --\n');
	items.push(msg);
	items.push('\n');
	return items.join('');
};


module.exports = Console;

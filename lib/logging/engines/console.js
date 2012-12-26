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
	return [
		'-- ', new Date().toISOString(), ' [ ', name, ' ', logLevel, ' ] --\n',
		msg, '\n'
	].join('');
};


module.exports = Console;

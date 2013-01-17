"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;


var UncaughtExceptionHandler = function () {
	this.logger = null;
};
inherits(UncaughtExceptionHandler, Unit);

UncaughtExceptionHandler.prototype.unitInit = function (units) {
	this.logger = units.require('core.logging').getLogger('uncaught');

	var self = this;
	process.on('uncaughtException', function (err) {
		self.handle(err);
	});
};

UncaughtExceptionHandler.prototype.handle = function (err) {
	if (this.logger) {
		this.logger.logError(err, 'critical');
	}
};


module.exports = UncaughtExceptionHandler;

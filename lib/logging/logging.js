"use strict";
var inherits = require('util').inherits;
var Unit = require('../units').Unit;
var Logger = require('./logger');


var Logging = function () {
	this.logger = new Logger();
};
inherits(Logging, Unit);

Logging.prototype.getLogger = function () {
	return this.logger;
};


module.exports = Logging;

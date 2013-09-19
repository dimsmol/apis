"use strict";
var util = require('util');
var mt = require('marked_types');
var Logger = require('./logger');
var WebError = require('../errors').WebError;


var WebLogger = function (name, settings, opt_engine) {
	Logger.call(this, name, settings, opt_engine);
};
util.inherits(WebLogger, Logger);

WebLogger.prototype.logError = function (err, opt_logLevel, opt_options) {
	var logLevel = opt_logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		var options = opt_options || {};
		if (mt.is(err, WebError))
		{
			// TODO it can be useful to log 4XX somewhere in separate place
			// to detect potential troubles

			// log only server errors and errors with unknown status
			// unless forced
			if (!err.isLogged && (options.force || err.status == null || err.isServerError)) {
				this.logInternal(logLevel, this.getErrorMessage(err, options));
			}
		}
		else {
			this.logInternal(logLevel, this.getErrorMessage(err, options));
		}
	}
};


module.exports = WebLogger;

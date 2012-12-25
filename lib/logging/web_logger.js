"use strict";
var util = require('util');
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
		if (WebError.isWebError(err))
		{
			// TODO it can be useful to log 4XX somewhere in separate place
			// to detect potential troubles

			// log only server errors and errors with unknown status
			// unless forced
			if (!err.isLogged && (options.force || err.status == null || err.isServerError)) {
				this.logInternal(logLevel, this.getErrorMessage(err));
			}
		}
		else {
			this.logInternal(logLevel, this.getErrorMessage(err));
		}
	}
};


module.exports = WebLogger;

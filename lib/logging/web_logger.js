"use strict";
var util = require('util');
var Logger = require('./logger');
var WebError = require('../errors').WebError;


var WebLogger = function (name, settings) {
	Logger.call(this, name, settings);
};
util.inherits(WebLogger, Logger);

WebLogger.prototype.logError = function (err, opt_logLevel, opt_ctx) {
	var logLevel = opt_logLevel || 'error';
	if (this.isEnabledFor(logLevel)) {
		if (WebError.isWebError(err))
		{
			// TODO it can be useful to log 4XX somewhere in separate place
			// to detect potential troubles

			// log server errors and errors with unknown status
			if (err.status == null || err.isServerError) {
				this.logInternal(logLevel, this.getErrorMessage(err));
			}
			// log transport level client errors (as warnings or less)
			// need it, because transport level errors usually cannot be sent to client
			else if (err.isClientError && err.isTransportLevel) {
				var effectiveLogLevel = this.minLevel(logLevel, 'warning');
				if (effectiveLogLevel == logLevel || this.isEnabledFor(effectiveLogLevel)) {
					this.logInternal(effectiveLogLevel, this.getErrorMessage(err));
				}
			}
		}
		else {
			this.logInternal(logLevel, this.getErrorMessage(err));
		}
	}
};


module.exports = WebLogger;

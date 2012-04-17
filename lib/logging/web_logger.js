"use strict";
var inherits = require('util').inherits;
var Logger = require('./logger');
var WebError = require('../errors').WebError;


var WebLogger = function (name, settings) {
	Logger.call(this, name, settings);
};
inherits(WebLogger, Logger);

WebLogger.prototype.logErrorInternal = function (err, logLevel) {
	// TODO ability to log request parameters
	if (err instanceof WebError)
	{
		if (err.status == null)
		{
			this.badError(err);
		}
		else
		{
			// TODO it can be useful to log 4XX somewhere in separate place
			// to detect potential troubles

			// do not log non-server errors
			if (err.status >= 500 && err.status < 600)
			{
				WebLogger.super_.prototype.logErrorInternal.call(this, err, logLevel);
			}
		}
	}
	else {
		WebLogger.super_.prototype.logErrorInternal.call(this, err, logLevel);
	}
};


module.exports = WebLogger;

"use strict";
var WebError = require('../errors').WebError;


var Logger = function () {
	this.handleError = null;

	this.handleError = this.createHanldeErrorFunc();
};

Logger.prototype.createHanldeErrorFunc = function () {
	var self = this;
	return function (err) {
		if (err != null)
		{
			self.error(err);
		}
	};
};

Logger.prototype.error = function (err) {
	// TODO more advanced error logging
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
				this.logError(err);
			}
		}
	}
	else
	{
		this.logError(err);
	}
};

Logger.prototype.logError = function (err) {
	var stack = err.stack;
	if (stack) {
		console.error(stack);
	}
	else {
		this.badError(err);
	}
};

Logger.prototype.badError = function (err) {
	var msg = 'Invalid error:';
	if (err instanceof WebError) {
		msg = 'Invalid WebError instance cought:';
	}
	console.error(msg, err);
};


module.exports = Logger;

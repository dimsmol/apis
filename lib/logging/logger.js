"use strict";
var HttpError = require('../errors').HttpError;


var Logger = function () {
	this.handleError = null;

	this.defineHanldeError();
};

Logger.prototype.defineHanldeError = function () {
	var self = this;
	this.handleError = function (err) {
		if (err != null)
		{
			self.error(err);
		}
	};
};

Logger.prototype.error = function (err) {
	// TODO more advanced error logging
	// TODO ability to log request parameters
	if (err instanceof HttpError)
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
	if (err instanceof HttpError) {
		msg = 'Invalid HttpError instance cought:';
	}
	console.error(msg, err);
};


module.exports = Logger;

var ErrorBase = require('../errors').ErrorBase;


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
	if (err instanceof ErrorBase)
	{
		if (err.status == null || err.getStackTrace == null)
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
				this.logError(err.getStackTrace(), err);
			}
		}
	}
	else
	{
		this.logError(err.stack, err);
	}
};

Logger.prototype.logError = function (msg, srcErr) {
	if (msg)
	{
		console.error(msg);
	}
	else
	{
		this.badError(srcErr);
	}
};

Logger.prototype.badError = function (err) {
	var msg = 'Invalid error:';
	if (err instanceof ErrorBase)
	{
		msg = 'Invalid ErrorBase instance cought:';
	}
	console.error(msg, err);
};


module.exports = Logger;

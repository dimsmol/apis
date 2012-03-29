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
		// TODO it can be useful to log 4XX somewhere in separate place
		// to detect potential troubles

		// do not log non-server errors
		if (err.status >= 500 && err.status < 600)
		{
			console.error(err.getStackTrace());
		}
	}
	else
	{
		console.error(err.stack);
	}
};


module.exports = Logger;

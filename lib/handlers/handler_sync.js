var inherits = require('util').inherits;

var Handler = require('./handler');


var HandlerSync = function () {
};
inherits(HandlerSync, Handler);

HandlerSync.prototype.name = 'HandlerSync';

HandlerSync.prototype.handle = function (ctx) {
	var catched = false;
	var result;

	try
	{
		result = this.handleInternal(ctx);
	}
	catch (exc)
	{
		catched = true;
		ctx.error(exc);
	}

	if (!catched)
	{
		if (result === undefined)
		{
			ctx.next();
		}
		else
		{
			// TODO way to use undefined as result using some special object
			ctx.result(result);
		}
	}
};

HandlerSync.prototype.handleRequest = function (ctx) {
};

HandlerSync.prototype.handleError = function (ctx) {
};


module.exports = HandlerSync;

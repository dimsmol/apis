var inherits = require('util').inherits;

var Handler = require('./handler');


var HandlerSync = function () {
};
inherits(HandlerSync, Handler);

Handler.prototype.handle = function (ctx) {
	var catched = false;
	var result = null;

	try
	{
		result = this.handleSync(ctx);
	}
	catch (exc)
	{
		catched = true;
		ctx.error(exc);
	}

	if (!catched)
	{
		ctx.next(result);
	}
};

Handler.prototype.handleSync = function (ctx) {
};

Handler.prototype.setup = function (chain) {
};


module.exports = Handler;

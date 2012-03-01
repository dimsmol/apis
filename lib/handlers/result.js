var inherits = require('util').inherits;

var Handler = require('./handler');


var Result = function (dataSpec) {
};
inherits(Result, Handler);

Result.prototype.handle = function (ctx) {
	var error = ctx.getError();
	var result = null;
	var statusCode = 200;

	if (error != null)
	{
		if (false) // TODO error instanceof ???)
		{
			statusCode = error.statusCode;
			result = error.data;
		}
		else
		{
			statusCode = 500;
			result = {
				message: 'Unhandled error'
			};
		}
	}
	else
	{
		result = ctx.result;
	}

	if (ctx.type == 'web')
	{
		// TODO provide status
		ctx.web.res.send(result);
	}
	else if(ctx.type == 'socket')
	{
		var socketCtx = ctx.socket;
		socketCtx.transport.sendResult(socketCtx, statusCode, result);
	}
	else
	{
		ctx.error(new Error('Unsupported context type "' + ctx.type + '"'));
	}

	ctx.responseSent();
	ctx.next();
};

Result.result = function (dataSpec) {
	return new Result(dataSpec);
};


module.exports = Result;

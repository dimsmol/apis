var inherits = require('util').inherits;

var Handler = require('./handler');


var Ret = function () {
};
inherits(Ret, Handler);

Ret.prototype.handle = function (ctx, next) {
	if (ctx.currentHandlerChain.impl == null)
	{
		throw new Error('No impl defined');
	}

	var handleResult = function (error, result) {
		if (ctx.type == 'web')
		{
			ctx.web.res.send(result);
			ctx.done();
			next(ctx);
		}
		else if(ctx.type == 'socket')
		{
			var socketCtx = ctx.socket;
			socketCtx.transport.sendResult(socketCtx, 200, result);
			ctx.done();
			next(ctx);
		}
		else
		{
			throw new Error('Unsupported context type "' + ctx.type + '"');
		}
	};

	ctx.currentHandlerChain.impl(ctx, handleResult);
};

var ret = function () {
	return new Ret();
};


module.exports = {
	Ret: Ret,
	ret: ret
};

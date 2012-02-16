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
		ctx.web.res.send(result);
		ctx.done();
		next(ctx);
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

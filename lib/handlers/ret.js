var inherits = require('util').inherits;

var Handler = require('./handler');
var Result = require('./result');


var Ret = function (dataSpec, impl, implIsSync) {
	this.setImpl(impl, implIsSync);

	this.resultHandler = new Result(dataSpec);
};
inherits(Ret, Handler);

Ret.prototype.setImpl = function (impl, isSync) {
	if (this.impl == null)
	{
		this.impl = impl;
		this.implIsSync = isSync;
	}
	else
	{
		throw new Error('Impl already set');
	}
};

Ret.prototype.setup = function (chain) {
	if (chain.ret)
	{
		throw new Error('Multiple Ret within chain');
	}
	chain.ret = this;
};

Ret.prototype.handle = function (ctx) {
	if (this.impl != null)
	{
		ctx.handlers.enter([this.resultHandler]);

		var catched = false;
		var result = null;

		try
		{
			result = this.impl(ctx);
		}
		catch (exc)
		{
			catched = true;
			ctx.error(exc);
		}

		if (this.implIsSync && !catched)
		{
			ctx.next(result);
		}
	}
	else
	{
		this.resultHandler.handle(ctx);
	}
};

Ret.ret = function (dataSpec, impl, implIsSync) {
	return new Ret(dataSpec);
};

Ret.rets = function (dataSpec, impl) {
	return Ret.ret(dataSpec, impl, true);
};


module.exports = Ret;

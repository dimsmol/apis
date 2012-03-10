var inherits = require('util').inherits;

var InternalError = require('../errors').InternalError;
var Handler = require('./handler');
var Result = require('./result');


var Ret = function (dataSpec, impl, implIsSync) {
	this.setImpl(impl, implIsSync);

	this.defineResultHandler(dataSpec);
};
inherits(Ret, Handler);

Ret.prototype.name = 'Ret';

Ret.prototype.defineResultHandler = function (dataSpec) {
	this.resultHandler = new Result(dataSpec);
};

Ret.prototype.setImpl = function (impl, isSync) {
	if (this.impl == null)
	{
		this.impl = impl;
		this.implIsSync = isSync;
	}
	else
	{
		throw new InternalError('Impl already set');
	}
};

Ret.prototype.setup = function (handlerContainer) {
	if (handlerContainer.setRet)
	{
		handlerContainer.setRet(this);
	}
};

Ret.prototype.handleRequest = function (ctx) {
	ctx.enter([this.resultHandler]);

	if (this.impl == null)
	{
		ctx.result(null);
	}
	else if (this.implIsSync)
	{
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

		if (!catched)
		{
			ctx.result(result);
		}
	}
	else
	{
		this.impl(ctx);
	}
};

Ret.prototype.handleError = function (ctx) {
	ctx.enter([this.resultHandler]);
	ctx.next();
};

Ret.ret = function (dataSpec, impl, implIsSync) {
	return new Ret(dataSpec);
};

Ret.rets = function (dataSpec, impl) {
	return Ret.ret(dataSpec, impl, true);
};


module.exports = Ret;

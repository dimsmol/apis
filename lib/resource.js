var Handler = require('./handlers/handler');


var HandlerChain = function (resource) {
	this.resource = resource;
	this.handlers = [];

	this.impl = null;
};

HandlerChain.prototype.add = function (handler) {
	if (handler instanceof Handler)
	{
		if (handler.setup(this))
		{
			this.handlers.push(handler);
		}
	}
};

HandlerChain.prototype.beforeExecute = function (ctx) {
	ctx.currentHandlerChain = this;
};

HandlerChain.prototype.afterExecute = function (ctx) {
	ctx.currentHandlerChain = null;
};

HandlerChain.prototype.execute = function (ctx, next) {
	this.beforeExecute(ctx);

	var self = this;

	var handlers = this.handlers;
	var i = 0;
	var nextInChain = function (ctx) {
		if (i >= handlers.length || ctx.isProcessed)
		{
			self.afterExecute(ctx);
			ctx.currentHandlerChain = null;

			if (!ctx.isProcessed)
			{
				next();
			}

			return;
		}

		var f = handlers[i++];
		if (f instanceof Handler)
		{
			f.handle(ctx, nextInChain);
		}
		else
		{
			f(ctx, nextInChain);
		}
	};

	nextInChain(ctx);
};


var MethodMapper = function () {
};

MethodMapper.prototype.getLogicalMethod = function (ctx) {
	return {
		GET: 'get',
		POST: 'update',
		DELETE: 'del'
	}[ctx.method];
};


var Resource = function (info) {
	this.path = info.path;

	if (info.call != null)
	{
		if (info.get != null || info.update != null || info.del != null)
		{
			throw new BadResourceError('Call-resource must not include other type handlers');
		}
	}

	this.handlers = {
		call: this.processHandlers(info.call),
		get: this.processHandlers(info.get),
		update: this.processHandlers(info.update),
		del: this.processHandlers(info.del)
	};

	this.methodMapper = new MethodMapper();
};

Resource.prototype.processHandlers = function (handlers) {
	if (handlers == null)
	{
		return null;
	}

	var chain = new HandlerChain(this);

	for (var k in handlers)
	{
		chain.add(handlers[k]);
	}

	return chain;
};

Resource.prototype.resolve = function (ctx) {
	var result = null;
	var logicalMethod = this.methodMapper.getLogicalMethod(ctx);

	if (this.path == ctx.path)
	{
		for (var method in this.handlers)
		{
			if (method == logicalMethod)
			{
				result = this.handlers[method];
				break;
			}
		}
	}

	return result;
};


module.exports = {
	HandlerChain: HandlerChain,
	Resource: Resource
};

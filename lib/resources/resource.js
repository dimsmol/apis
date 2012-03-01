var Chain = require('../handlers/chain');
var MethodMapper = require('./method_mapper');


var Resource = function (info) {
	if (!info.path)
	{
		throw new Error('path missed');
	}

	this.path = info.path;

	if (info.call != null)
	{
		if (info.get != null || info.update != null || info.del != null)
		{
			throw new Error('Call-resource must not include other type handlers');
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

	var chain = new Chain(this);

	for (var k in handlers)
	{
		chain.add(handlers[k]);
	}

	return chain;
};

Resource.prototype.resolve = function (ctx) {
	var result = null;

	if (this.path == ctx.path)
	{
		var logicalMethod = this.methodMapper.getLogicalMethod(ctx);
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


module.exports = Resource;

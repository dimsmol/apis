var Resource = require('./resource').Resource;


var Contract = function (path) {
	this.path = path;
	this.items = [];
};

Contract.prototype.add = function (item) {
	if (typeof item === 'object')
	{
		item = new Resource(item);
	}

	this.items.push(item);
};

Contract.prototype.handle = function (ctx, next) {
	var handlerChain = this.resolve(ctx);
	if (handlerChain != null)
	{
		handlerChain.execute(ctx, next);
	}
	else
	{
		next();
	}
};

Contract.prototype.resolve = function (ctx) {
	for (var k in this.items)
	{
		var item = this.items[k];
		var result = item.resolve(ctx);
		if (result != null)
		{
			return result;
		}
	}

	return null;
};


module.exports = Contract;

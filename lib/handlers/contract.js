var inherits = require('util').inherits;

var Resource = require('../resources/resource');

var Handler = require('./handler');


var Contract = function (path) {
	this.path = path;
	this.items = [];
};
inherits(Contract, Handler);

Contract.prototype.handle = function (ctx) {
	var chain = null;

	if (ctx.subPath(this.path))
	{
		chain = this.resolve(ctx);
		ctx.restorePath();
	}

	if (chain != null)
	{
		chain.handle(ctx);
	}
	else
	{
		ctx.next();
	}
};

// TODO allow subcontracts handling
Contract.prototype.add = function (item) {
	if (typeof item === 'object')
	{
		item = new Resource(item);
	}

	this.items.push(item);
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

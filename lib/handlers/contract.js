var inherits = require('util').inherits;

var Resource = require('../resources/resource');

var Handler = require('./handler');


// NOTE Contract is Handler, but can act as Resource as well
var Contract = function (path) {
	this.path = path;
	this.items = [];
};
inherits(Contract, Handler);

Contract.prototype.setup = function (f) {
	f(this);
	return this;
};

Contract.prototype.handle = function (ctx) {
	var handler = this.resolve(ctx);

	if (handler != null)
	{
		handler.handle(ctx);
	}
	else
	{
		ctx.next();
	}
};

Contract.prototype.add = function (item) {
	if (!(item instanceof Resource || item instanceof Contract))
	{
		item = new Resource(item);
	}

	this.items.push(item);
};

Contract.prototype.resolve = function (ctx) {
	var result = null;

	if (ctx.subPath(this.path))
	{
		for (var k in this.items)
		{
			var item = this.items[k];

			result = item.resolve(ctx);
			if (result != null)
			{
				break;
			}
		}

		ctx.restorePath();
	}

	return result;
};


module.exports = Contract;

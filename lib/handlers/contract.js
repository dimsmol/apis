var inherits = require('util').inherits;

var Resource = require('../resources/resource');
var NotFound = require('../errors').NotFound;
var Handler = require('./handler');
var Result = require('./result');


// NOTE Contract is Handler, but can act as Resource as well
var Contract = function (path, isMain) {
	this.path = path;
	this.isMain = !!isMain;

	this.items = [];

	this.defineResultHandler();
};
inherits(Contract, Handler);

Contract.prototype.name = 'Contract';

Contract.prototype.defineResultHandler = function () {
	this.resultHandler = new Result();
};

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
	else if (this.isMain)
	{
		ctx.enter([this.resultHandler]);
		ctx.error(new NotFound());
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

Contract.contract = function (path, items, isMain) {
	var result = new Contract(path, isMain);

	for (var k in items)
	{
		var item = items[k];
		result.add(item);
	}

	return result;
};

Contract.cont = function (path, items) {
	if (arguments.length == 1)
	{
		items = path;
		path = null;
	}

	return Contract.contract(path, items);
};

Contract.main = function (path, items) {
	if (arguments.length == 1)
	{
		items = path;
		path = null;
	}

	return Contract.contract(path, items, true);
};


module.exports = Contract;

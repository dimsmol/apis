"use strict";
var inherits = require('util').inherits;

var Resource = require('../resources/resource');
var NotFound = require('../errors').NotFound;
var Handler = require('./core/handler');
var Result = require('./result');


// NOTE implements Resource, Unit
var Contract = function (path, isMain) {
	this.path = path;
	this.isMain = !!isMain;

	this.items = [];

	this.resultHandler = this.createResultHandler();
};
inherits(Contract, Handler);

Contract.prototype.unitInit = function () {
};

Contract.prototype.name = 'Contract';

Contract.prototype.addItems = function (items) {
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		this.add(item);
	}
};

Contract.prototype.add = function (item) {
	if (!(item instanceof Resource || item instanceof Contract)) {
		item = new Resource(item);
	}

	this.items.push(item);
};

Contract.prototype.createResultHandler = function () {
	return new Result();
};

Contract.prototype.handle = function (ctx) {
	var handler = this.resolve(ctx);

	if (handler != null) {
		handler.handle(ctx);
	}
	else if (this.isMain) {
		ctx.enter([this.resultHandler]);
		ctx.error(new NotFound());
	}
	else {
		ctx.next();
	}
};

Contract.prototype.resolve = function (ctx) {
	var result = null;

	if (ctx.subPath(this.path)) {
		for (var i = 0; i < this.items.length; i++) {
			var item = this.items[i];

			result = item.resolve(ctx);
			if (result != null) {
				break;
			}
		}

		ctx.restorePath();
	}

	return result;
};

Contract.contract = function (path, items, isMain) {
	var result = new Contract(path, isMain);
	result.addItems(items);
	return result;
};

Contract.cont = function (path, items) {
	if (arguments.length == 1) {
		items = path;
		path = null;
	}

	return Contract.contract(path, items);
};

Contract.main = function (path, items) {
	if (arguments.length == 1) {
		items = path;
		path = null;
	}

	return Contract.contract(path, items, true);
};


module.exports = Contract;

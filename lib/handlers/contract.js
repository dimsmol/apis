"use strict";
var inherits = require('util').inherits;

var NotFound = require('../errors').NotFound;
var Handler = require('./core/handler');
var Result = require('./result');


// NOTE implements Resource, Unit
var Contract = function (path, isMain) {
	Handler.call(this);

	this.path = path;
	this.isMain = !!isMain;

	if (this.path && this.path.constructor === RegExp && this.path.global) {
		throw new Error('Path RegExp must not be global');
	}

	this.items = [];
	this.resultHandler = this.createResultHandler();
};
inherits(Contract, Handler);

Contract.prototype.unitInit = function () {
};

Contract.prototype.name = 'Contract';

Contract.prototype.addItems = function (items) {
	for (var i = 0; i < items.length; i++) {
		this.add(items[i]);
	}
};

Contract.prototype.add = function (item) {
	if (item != null) {
		this.items.push(item);
	}
};

Contract.prototype.createResultHandler = function () {
	return new Result();
};

Contract.prototype.handle = function (ctx) {
	var handler;
	var error;
	try {
		handler = this.resolve(ctx);
	} catch (err) {
		error = err;
	}

	if (handler != null) {
		handler.handle(ctx);
	}
	else {
		if (error == null && this.isMain) {
			error = new NotFound();
		}

		if (error != null) {
			ctx.enter([this.resultHandler]);
			ctx.error(error);
		}
		else {
			ctx.next();
		}
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

		if (result == null) {
			ctx.restorePath();
		}
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

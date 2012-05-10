"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Chain = function (resource) {
	this.resource = resource;

	this.handlers = [];
	this.ret = null;
};
inherits(Chain, Handler);

Chain.prototype.name = 'Chain';

Chain.prototype.handleRequest = function (ctx) {
	ctx.enter(this.handlers);
	ctx.next();
};

Chain.prototype.add = function (handler) {
	handler.setup(this);
	this.handlers.push(handler);
};

Chain.prototype.getRet = function () {
	return this.ret;
};

Chain.prototype.setRet = function (ret) {
	if (this.ret != null)
	{
		throw new Error('Multiple Ret within chain');
	}

	this.ret = ret;
};

Chain.chain = function (resource) {
	return new Chain(resource);
};


module.exports = Chain;

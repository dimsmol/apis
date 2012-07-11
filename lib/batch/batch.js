"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var MethodNotAllowed = require('../errors').MethodNotAllowed;
var Resource = require('../resources/resource');
var handlers = require('../handlers');
var Mechanics = require('./mechanics');
var Applier = require('./applier');

var Chain = handlers.Chain;
var data = handlers.data;
var impl = handlers.impl;
var ret = handlers.ret;

var validators = valid.validators;
var any = validators.any;
var dict = validators.dict;
var str = validators.str;
var opt = validators.opt;
var v = validators.v;
var intNum = validators.intNum;
var range = validators.range;


var Batch = function (path, contract, applierClass) {
	this.path = path;
	this.contract = contract;
	this.applierClass = applierClass || Applier;

	this.handlers = this.createHandlers();
};
inherits(Batch, Resource);

Batch.prototype.getHandlers = function () {
	var self = this;
	return [
		data([{
			name: str,
			headers: {
				path: str,
				method: str,
				'*': opt(any)
			},
			data: opt(any),
			apply: opt(any)
		}]),
		ret([{
			name: str,
			headers: { status: v(intNum, range(0)), '*': opt(any) },
			data: any
		}]),
			impl(function (ctx) {
				self.handle(ctx);
			})
	];
};

Batch.prototype.createHandlers = function () {
	var handlers = this.getHandlers();
	var chain = new Chain(this);
	for (var i = 0; i < handlers.length; i++) {
		chain.add(handlers[i]);
	}
	return chain;
};

Batch.prototype.handle = function (ctx) {
	var mechanics = new Mechanics(ctx, this.contract, this.applierClass);
	mechanics.next();
};

Batch.prototype.resolve = function (ctx) {
	var result = null;
	if (this.path == ctx.path || !this.path && !ctx.path) {
		var wrongMethodError = false;
		var headers = ctx.mechanicsCtx.headers;
		if (headers != null) {
			wrongMethodError =  (headers.method != 'call');
		}
		else {
			wrongMethodError = (ctx.mechanicsCtx.req.method != 'POST');
		}
		if (wrongMethodError) {
			throw new MethodNotAllowed(['call'], ['POST']);
		}
		result = this.handlers;
	}
	return result;
};

Batch.batch = function (path, contract) {
	return new Batch(path, contract);
};


module.exports = Batch;

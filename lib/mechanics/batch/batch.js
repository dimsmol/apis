"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var MethodNotAllowed = require('../../errors').MethodNotAllowed;
var Resource = require('../../resources/resource');
var handlers = require('../../handlers');
var Mechanics = require('./mechanics');
var Applier = require('./applier');

var chain = handlers.chain;
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


var Batch = function (path, contract, optAuth, opt_applierClass) {
	this.path = path;
	this.contract = contract;
	this.optAuth = optAuth;
	this.applierClass = opt_applierClass || Applier;

	this.handlers = this.createHandlers();
};
inherits(Batch, Resource);

Batch.prototype.getHandlers = function () {
	var self = this;
	return [
		this.optAuth,
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
	return chain(this.getHandlers());
};

Batch.prototype.handle = function (ctx) {
	if (this.hasCorrectMethod(ctx)) {
		var mechanics = new Mechanics(ctx, this.contract, this.applierClass);
		mechanics.handle();
	}
	else {
		ctx.error(new MethodNotAllowed(['call'], ['POST']));
	}
};

Batch.prototype.hasCorrectMethod = function (ctx) {
	var methodAllowed = true;
	var method = ctx.req.method;
	if (ctx.isHttp) {
		method = {
			POST: 'call',
			GET: 'get'
		}[method];
	}
	// NOTE allow to use 'get' if all requests in batch are 'get'
	if (method == 'get') {
		var requests = ctx.data;
		for (var i = 0; i < requests.length; i++) {
			if (requests[i].headers.method != 'get') {
				methodAllowed = false;
				break;
			}
		}
	}
	else {
		methodAllowed = (method == 'call');
	}
	return methodAllowed;
};

Batch.prototype.resolve = function (ctx) {
	var result = null;
	if (this.path == ctx.path || !this.path && !ctx.path) {
		result = this.handlers;
	}
	return result;
};

Batch.batch = function (path, contract) {
	return new Batch(path, contract);
};


module.exports = Batch;

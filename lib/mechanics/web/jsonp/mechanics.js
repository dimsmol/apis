"use strict";
var valid = require('valid');
var Ctx = require('../../../ctx');
var Result = require('../../../handlers/result');
var HeadersParseError = require('../../../errors').HeadersParseError;
var Request = require('../../core/request');
var Response = require('../../core/response');

var any = valid.validators.any;


var Mechanics = function (ctx) {
	this.ctx = ctx;
	this.units = ctx.mechanics.units; // need it for child ctx
	this.handler = this.ctx.mechanics.handler; // NOTE can be overriden below
};

Mechanics.prototype.isHttp = false;
Mechanics.prototype.isJsonp = true;

Mechanics.prototype.handle = function () {
	var ctx = this.createCtx();
	this.handler.handle(ctx);
};

Mechanics.prototype.createCtx = function () {
	var headers = null;
	var err;

	try {
		headers = this.parseHeaders();
	}
	catch (createCtxErr) {
		err = createCtxErr;
	}

	var req = new Request(headers, this.ctx.req.query.body);
	req.headers.path = this.ctx.req.path; // override path
	req.headers.method = req.headers.method || 'get';
	var res = new Response(this);

	var self = this;
	var ctx = new Ctx(this, req, res, function (err) {
		if (err != null && !ctx.isResponseSend) {
			// shouldn't happen, actually
			// error is already logged by ctx at this point
			ctx.res.statusCode = 500;
			self.sendResult(ctx, { message: 'Internal server error' });
		}
	});
	ctx.transportCtx = this.ctx;

	if (err) {
		ctx.setError(err);
		this.handler = new Result(any); // sending error directly
	}

	return ctx;
};

Mechanics.prototype.parseHeaders = function () {
	var query = this.ctx.req.query;
	var result = null;
	if (query.headers) {
		try {
			result = JSON.parse(query.headers);
		}
		catch (parseErr) {
			throw new HeadersParseError(parseErr, 'headers');
		}
	}
	return result;
};

Mechanics.prototype.createResponseResult = function (ctx, result) {
	var headers = ctx.res.headers;
	if (ctx.res.statusCode != null) {
		headers.status = ctx.res.statusCode;
	}
	return {
		headers: headers,
		data: result
	};
};

Mechanics.prototype.sendResult = function (ctx, result) {
	var responseResult = this.createResponseResult(ctx, result);
	this.ctx.res.statusCode = 200;
	this.ctx.sendResult(responseResult);
};


module.exports = Mechanics;

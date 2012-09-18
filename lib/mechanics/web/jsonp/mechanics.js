"use strict";
var valid = require('valid');
var Ctx = require('../../../ctx');
var HeadersParseError = require('../../../errors').HeadersParseError;
var Result = require('../../../handlers/result');
var Request = require('../../core/request');
var Response = require('../../core/response');

var any = valid.validators.any;


var Mechanics = function (ctx) {
	this.ctx = ctx;
	this.units = ctx.mechanics.units; // need it for child ctx
};

Mechanics.prototype.isHttp = false;
Mechanics.prototype.isJsonp = true;

Mechanics.prototype.handle = function () {
	var headers = null;
	var err = null;

	try {
		headers = this.parseHeaders();
	}
	catch (parseHeadersErr) {
		err = parseHeadersErr;
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
		this.getErrorReportingHandler().handle(ctx);
	}
	else {
		this.ctx.mechanics.handler.handle(ctx);
	}
};

Mechanics.prototype.getErrorReportingHandler = function () {
	return new Result(any);
};

Mechanics.prototype.parseHeaders = function () {
	var query = this.ctx.req.query;
	var result = null;
	if (query.headers) {
		try {
			result = JSON.parse(query.headers);
		}
		catch (parseErr) {
			throw new HeadersParseError(parseErr);
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

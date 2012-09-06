"use strict";
var Ctx = require('../../../ctx');
var Request = require('../../core/request');
var Response = require('../../core/response');


var Mechanics = function (ctx) {
	this.ctx = ctx;
	this.units = ctx.mechanics.units; // need it for child ctx
};

Mechanics.prototype.isHttp = false;

Mechanics.prototype.handle = function () {
	var ctx = this.createCtx();
	this.ctx.mechanics.handler.handle(ctx);
};

Mechanics.prototype.createCtx = function () {
	var self = this;
	var query = this.ctx.req.query;
	var req = new Request(query.headers, query.body);
	req.headers.path = this.ctx.req.path;
	req.headers.method = req.headers.method || query.method || 'get';
	var res = new Response(this);
	var ctx = new Ctx(this, req, res, function (err) {
		if (err != null && !ctx.isResponseSend) {
			// shouldn't happen, actually
			// error is already logged by ctx at this point
			ctx.res.statusCode = 500;
			this.sendResult(ctx, { message: 'Internal server error' });
		}
	});
	ctx.transportCtx = this.ctx;
	return ctx;
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

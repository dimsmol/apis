"use strict";
var inherits = require('util').inherits;
var errors = require('../errors');
var Handler = require('./core/handler');
var resultHandler = require('./result').result;


var HttpOnly = function (opt_errorHandler) {
	Handler.call(this);
	this.errorHandler = opt_errorHandler || resultHandler.any;
};
inherits(HttpOnly, Handler);

HttpOnly.prototype.name = 'HttpOnly';

HttpOnly.prototype.handleRequest = function (ctx) {
	if (ctx.isHttp) {
		this.handleHttpRequest(ctx);
	}
	else {
		this.error(ctx, this.createHttpExpectedError(ctx));
	}
};

HttpOnly.prototype.handleHttpRequest = function (ctx) {
	ctx.next();
};

HttpOnly.prototype.createHttpExpectedError = function (ctx) {
	return new errors.BadRequest('HTTP request expected');
};

HttpOnly.prototype.error = function (ctx, err) {
	ctx.enter([this.errorHandler]);
	ctx.error(err);
};

HttpOnly.httpOnly = function (opt_errorHandler) {
	return new HttpOnly(opt_errorHandler);
};


module.exports = HttpOnly;

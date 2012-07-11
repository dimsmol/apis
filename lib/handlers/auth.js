"use strict";
var inherits = require('util').inherits;

var AuthRequired = require('../errors').AuthRequired;
var HandlerSync = require('./core/handler_sync');


var Auth = function (authenticateFunc, isAuthOptional) {
	this.authenticateFunc = authenticateFunc;
	this.isAuthOptional = !!isAuthOptional;
};
inherits(Auth, HandlerSync);

Auth.prototype.name = 'Auth';

Auth.prototype.extractToken = function (ctx) {
	var result;
	if (ctx.mechanicsCtx.headers != null) {
		result = ctx.mechanicsCtx.headers.auth;
	}
	else if (ctx.mechanicsCtx.req != null) {
		if (ctx.mechanicsCtx.req.cookies != null) {
			result = ctx.mechanicsCtx.req.cookies.auth;
		}
	}
	return result;
};

Auth.prototype.handleRequest = function (ctx) {
	var authToken = this.extractToken(ctx);
	if (authToken == null && ctx.mechanicsCtx.parentCtx != null) {
		authToken = this.extractToken(ctx.mechanicsCtx.parentCtx);
	}

	var userId;
	if (authToken) {
		userId = this.authenticateFunc(authToken);
	}

	if (userId == null && !this.isAuthOptional) {
		throw new AuthRequired();
	}

	ctx.auth = {
		userId: userId
	};
};

Auth.auth = function (authenticateFunc, isAuthOptional) {
	return new Auth(authenticateFunc, isAuthOptional);
};


module.exports = Auth;

"use strict";
var inherits = require('util').inherits;

var AuthRequired = require('../errors').AuthRequired;
var HandlerSync = require('./core/handler_sync');


var Auth = function (authenticateFunc) {
	this.authenticateFunc = authenticateFunc;
};
inherits(Auth, HandlerSync);

Auth.prototype.name = 'Auth';

Auth.prototype.extractToken = function (ctx) {
	var result;
	if (ctx.mechanicsCtx.header != null) {
		result = ctx.mechanicsCtx.header.auth;
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

	// TODO allow optional auth
	if (userId == null) {
		throw new AuthRequired();
	}

	ctx.auth = {
		userId: userId
	};
};

Auth.auth = function (authenticateFunc) {
	return new Auth(authenticateFunc);
};


module.exports = Auth;

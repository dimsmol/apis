"use strict";
var inherits = require('util').inherits;

var AuthRequired = require('../errors').AuthRequired;
var HandlerSync = require('./handler_sync');


var Auth = function (authenticateFunc) {
	this.authenticateFunc = authenticateFunc;
};
inherits(Auth, HandlerSync);

Auth.prototype.name = 'Auth';

Auth.prototype.handleRequest = function (ctx) {
	var authToken = null;
	var userId = null;

	if (ctx.type == 'web')
	{
		if (ctx.web.req.cookies)
		{
			authToken = ctx.web.req.cookies.auth;
		}
	}
	else if(ctx.type == 'socket')
	{
		authToken = ctx.socket.header.auth;
	}


	if (authToken)
	{
		userId = this.authenticateFunc(authToken);
	}

	// TODO allow optional auth
	if (userId == null)
	{
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

"use strict";
var inherits = require('util').inherits;

var errors = require('../errors');
var HandlerSync = require('./core/handler_sync');


var UnexpectedAuth = function () {
	errors.Conflict.call(this);
};
inherits(UnexpectedAuth, errors.Conflict);

UnexpectedAuth.prototype.name = 'UnexpectedAuth';

UnexpectedAuth.prototype.getMessage = function () {
	return this.status + ' Unexpected Auth Identity';
};


var ChildContextAuthProhibited = function () {
	errors.Conflict.call(this);
};
inherits(ChildContextAuthProhibited, errors.Conflict);

ChildContextAuthProhibited.prototype.name = 'ChildContextAuthProhibited';

ChildContextAuthProhibited.prototype.getMessage = function () {
	return this.status + ' Child Context Authentication Prohibited';
};


var Auth = function (tokener, isAuthOptional) {
	this.tokener = tokener;
	this.isAuthOptional = !!isAuthOptional;
};
inherits(Auth, HandlerSync);

Auth.prototype.name = 'Auth';

Auth.prototype.extractData = function (ctx) {
	var result;
	var headers = ctx.mechanicsCtx.headers;
	if (headers != null && headers.auth != null) {
		result = {
			token: headers.auth,
			expectedIdentity: headers.authExpected
		};
	}
	else {
		var req = ctx.mechanicsCtx.req;
		if (req != null) {
			result = this.tokener.getAuthData(req);
		}
	}
	return result;
};

Auth.prototype.handleRequest = function (ctx) {
	var auth = null;
	var parentCtx = ctx.mechanicsCtx.parentCtx;

	var data = this.extractData(ctx);
	if (data != null) {
		if (parentCtx != null) {
			throw new ChildContextAuthProhibited();
		}

		var authResult = this.tokener.auth(data.token, data.additionalToken, data.expectedIdentity, ctx.mechanicsCtx.res == null);
		if (authResult != null) {
			if (authResult.unexpectedIdentity) {
				throw new UnexpectedAuth();
			}

			auth = this.createCtxAuth(ctx, authResult.auth);

			var renewal = authResult.renewal;
			if (renewal != null) {
				this.applyRenewal(ctx, renewal);
			}
		}
	}
	else if (parentCtx != null && parentCtx.auth != null) {
		auth = parentCtx.auth;
	}

	if (auth != null) {
		if (this.isAuthorized(ctx, auth)) {
			ctx.auth = auth;
		}
		else if (!this.isAuthOptional) {
			throw new errors.Forbidden();
		}
	}
	else if (!this.isAuthOptional) {
		throw new errors.AuthRequired();
	}
};

Auth.prototype.createCtxAuth = function (ctx, token) {
	return { identity: token.identity };
};

Auth.prototype.isAuthorized = function (ctx, auth) {
	return true;
};

Auth.prototype.applyRenewal = function (ctx, renewal) {
	var res = ctx.mechanicsCtx.res;
	if (res != null) {
		this.tokener.applyRenewal(res, renewal);
	}
	else {
		ctx.mechanicsCtx.responseHeaders.authRenewal = renewal.result;
	}
};

Auth.auth = function (tokener) {
	var result = new Auth(tokener);
	result.opt = new Auth(tokener, true);
	return result;
};

Auth.UnexpectedAuth = UnexpectedAuth;

Auth.ChildContextAuthProhibited = ChildContextAuthProhibited;


module.exports = Auth;

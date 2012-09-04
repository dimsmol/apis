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
	var result = null;
	if (ctx.isHttp) {
		result = this.tokener.getAuthData(ctx.req);
	}
	else {
		var headers = ctx.req.headers;
		if (headers.auth != null) {
			result = {
				token: headers.auth,
				expectedIdentity: headers.authExpected
			};
		}
	}
	return result;
};

Auth.prototype.handleRequest = function (ctx) {
	var auth = null;

	var data = this.extractData(ctx);
	if (data != null) {
		if (ctx.transportCtx != null) {
			throw new ChildContextAuthProhibited();
		}

		var authResult = this.tokener.auth(data.token, data.additionalToken, data.expectedIdentity, !ctx.isHttp);
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
	else if (ctx.transportCtx != null) {
		auth = ctx.transportCtx.auth;
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
	var res = ctx.res;
	if (ctx.isHttp) {
		this.tokener.applyRenewal(res, renewal);
	}
	else {
		res.headers.authRenewal = renewal.result;
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

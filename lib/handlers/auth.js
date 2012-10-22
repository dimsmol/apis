"use strict";
var inherits = require('util').inherits;

var errors = require('../errors');
var Handler = require('./core/handler');


var UnexpectedAuth = function () {
	errors.Conflict.call(this);
};
inherits(UnexpectedAuth, errors.Conflict);

UnexpectedAuth.prototype.name = 'UnexpectedAuth';

UnexpectedAuth.prototype.getMessage = function () {
	return this.status + ' Unexpected Auth Identity';
};


var Auth = function (tokener) {
	Handler.call(this);
	this.tokener = tokener;
	this.isAuthOptional = false;
	this.isAllowCookieOnly = false;
};
inherits(Auth, Handler);

Auth.prototype.name = 'Auth';

Auth.prototype.handleRequest = function (ctx) {
	var self = this;
	this.extractAuth(ctx, function (err, auth) {
		if (err) {
			ctx.error(err);
		}
		else if (auth != null || self.isAuthOptional) {
			ctx.auth = auth;
			self.authorize(ctx);
		}
		else {
			ctx.error(new errors.AuthRequired());
		}
	});
};

Auth.prototype.extractAuth = function (ctx, cb) {
	var err = null;
	var result = null;

	var data = this.extractData(ctx);
	if (data != null) {
		var authResult = this.tokener.auth(data.token, data.additionalToken, data.expectedIdentity, !ctx.isHttp);
		if (authResult != null) {
			if (authResult.unexpectedIdentity) {
				err = new UnexpectedAuth();
			}
			else {
				result = this.createCtxAuth(ctx, authResult.auth, !!data.cookieOnly);

				var renewal = authResult.renewal;
				if (renewal != null) {
					this.applyRenewal(ctx, renewal);
				}
			}
		}
	}
	else if (ctx.transportCtx != null) {
		result = ctx.transportCtx.auth;
	}

	cb(err, result);
};

Auth.prototype.extractData = function (ctx) {
	var result = null;
	if (ctx.isHttp) {
		result = this.tokener.getAuthData(ctx.req, this.isAllowCookieOnly);
	}
	else {
		var headers = ctx.req.headers;
		if (headers.auth != null) {
			result = {
				token: headers.auth,
				expectedIdentity: headers.authExpected
			};
			if (ctx.transportCtx != null && ctx.transportCtx.isHttp) {
				result.additionalToken = this.tokener.getAdditionalTokenFromCookie(ctx.transportCtx.req);
			}
		}
	}
	return result;
};

Auth.prototype.createCtxAuth = function (ctx, token, isCookieOnly) {
	var result = { identity: token.identity };
	if (isCookieOnly) {
		result.cookieOnly = true;
	}
	return result;
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

Auth.prototype.authorize = function (ctx) {
	// NOTE ctx.auth can be null here if auth is optional
	// don't forget to provide authorization rules for this case
	// if overriding this method
	ctx.next();
};

Object.defineProperties(Auth.prototype, {
	opt: {
		get: function () {
			this.isAuthOptional = true;
			return this;
		}
	},
	// WARN disables CSRF protection, highly unrecommended
	allowCookieOnly: {
		get: function () {
			this.isAllowCookieOnly = true;
			return this;
		}
	}
});

Auth.auth = function (tokener) {
	var result = new Auth(tokener);
	return result;
};

Auth.UnexpectedAuth = UnexpectedAuth;


module.exports = Auth;

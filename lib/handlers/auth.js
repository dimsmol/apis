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
inherits(Auth, Handler);

Auth.prototype.name = 'Auth';

Auth.prototype.handleRequest = function (ctx) {
	var self = this;
	this.extractAuth(ctx, function (err, auth) {
		if (err) {
			ctx.error(err);
		}
		else {
			ctx.auth = auth;
			self.authorize(ctx);
		}
	});
};

Auth.prototype.extractAuth = function (ctx, cb) {
	var err = null;
	var result = null;

	var data = this.extractData(ctx);
	if (data != null) {
		if (ctx.transportCtx != null) {
			err = new ChildContextAuthProhibited();
		}
		else {
			var authResult = this.tokener.auth(data.token, data.additionalToken, data.expectedIdentity, !ctx.isHttp);
			if (authResult != null) {
				if (authResult.unexpectedIdentity) {
					err = new UnexpectedAuth();
				}
				else {
					result = this.createCtxAuth(ctx, authResult.auth);

					var renewal = authResult.renewal;
					if (renewal != null) {
						this.applyRenewal(ctx, renewal);
					}
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

Auth.prototype.createCtxAuth = function (ctx, token) {
	return { identity: token.identity };
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
	if (ctx.auth != null || this.isAuthOptional) {
		this.authorizeAuthenticated(ctx);
	}
	else {
		ctx.error(new errors.AuthRequired());
	}
};

Auth.prototype.authorizeAuthenticated = function (ctx) {
	ctx.next();
};

Auth.auth = function (tokener) {
	var result = new Auth(tokener);
	result.opt = new Auth(tokener, true);
	return result;
};

Auth.UnexpectedAuth = UnexpectedAuth;

Auth.ChildContextAuthProhibited = ChildContextAuthProhibited;


module.exports = Auth;

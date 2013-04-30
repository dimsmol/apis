"use strict";
var ops = require('ops');


var CtxAdapter = function (httpAdapter, opt_options) {
	this.httpAdapter = httpAdapter;
	this.options = ops.cloneWithDefaults(opt_options, this.getDefaultOptions());
	this.options.onBehalfOfHeaderNameLower = this.options.onBehalfOfHeaderName.toLower();
};

CtxAdapter.prototype.getDefaultOptions = function () {
	return {
		providerKeySeparator: ':',
		onBehalfOfHeaderName: 'X-AuthOnBehalfOf'
	};
};

CtxAdapter.prototype.extractAuthData = function (ctx) {
	var result;
	if (ctx.isHttp) {
		result = this.httpAdapter.extractAuthData(ctx.req);
	}
	else {
		result = this.extractDirectAuthData(ctx);
	}
	return result;
};

CtxAdapter.prototype.extractDirectAuthData = function (ctx) {
	var result = null;
	var headers = ctx.req.headers;
	if (headers.auth != null && headers.auth.token) {
		result = {
			token: headers.auth.token,
			isCsrfProtected: true,
			expectedIdentityStr: headers.auth.expected
		};
		if (ctx.transportCtx != null && ctx.transportCtx.isHttp) {
			result.additionalToken = this.getCookieToken(ctx.transportCtx.req);
		}
	}
	return result;
};

CtxAdapter.prototype.applyAuthData = function (ctx, tokenInfo, maxAge, useCookies) {
	if (ctx.isHttp) {
		this.httpAdapter.applyAuthData(ctx.res, tokenInfo, maxAge, useCookies);
	}
	else {
		this.applyDirectAuthData(ctx, tokenInfo);
	}
};

CtxAdapter.prototype.applyDirectAuthData = function (ctx, tokenInfo) {
	// it seems, nothing to do here
};

CtxAdapter.prototype.applyRenewal = function (ctx, renewalTokenInfo, maxAge, useCookies) {
	if (ctx.isHttp) {
		this.httpAdapter.applyAuthData(ctx.res, renewalTokenInfo, maxAge, useCookies);
	}
	else {
		this.applyDirectRenewal(ctx, renewalTokenInfo);
	}
};

CtxAdapter.prototype.applyDirectRenewal = function (ctx, renewalTokenInfo) {
	ctx.res.headers.authRenewal = renewalTokenInfo.renewal;
};

CtxAdapter.prototype.clearCookies = function (ctx) {
	if (ctx.isHttp) {
		this.httpAdapter.clearCookies(ctx.res);
	}
	else {
		throw new Error('Unsupported for non-HTTP');
	}
};

CtxAdapter.prototype.extractOnBehalfData = function (ctx) {
	if (ctx.isHttp) {
		this.extractHttpOnBehalfData(ctx);
	}
	else {
		this.extractDirectOnBehalfData(ctx);
	}
};

CtxAdapter.prototype.extractHttpOnBehalfData = function (ctx) {
	return {
		identityStr: ctx.req.headers[this.options.onBehalfOfHeaderNameLower]
	};
};

CtxAdapter.prototype.extractDirectOnBehalfData = function (ctx) {
	return {
		identityStr: ctx.req.headers.auth.onBehalfOf
	};
};

CtxAdapter.prototype.extractProviderKey = function (ctx, authData) {
	var result = null;
	var token = (authData != null ? authData.token : null);
	if (token) {
		result = token.split(this.options.providerKeySeparator, 1)[0];
	}
	return result;
};


module.exports = CtxAdapter;

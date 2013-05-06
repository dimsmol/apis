"use strict";
var inherits = require('util').inherits;
var ops = require('ops');
var errors = require('../errors');
var UnexpectedIdentity = require('../auth/errors').UnexpectedIdentity;
var Handler = require('./core/handler');


var Auth = function (opt_options) {
	Handler.call(this);
	this.options = ops.cloneWithDefaults(opt_options, this.getDefaultOptions());
	this.restrictTo(this.options.allowedProviderTypes);

	this.adapter = null;
	this.providers = {};
	this.authorizationFunc = null;
};
inherits(Auth, Handler);

Auth.prototype.name = 'Auth';

Auth.prototype.getDefaultOptions = function () {
	return {
		defaultOnBehalfAuthType: null,

		renewalMode: null,
		isOptional: false,
		allowUnprotected: false,
		allowOnBehalf: true,
		allowedProviderTypes: null
	};
};

Auth.prototype.setAdapter = function (adapter) {
	this.adapter = adapter;
};

Auth.prototype.setProviders = function (providers) {
	this.providers = providers; // NOTE key must be provider's key, not type
};

Auth.prototype.addProvider = function (provider) {
	this.providers[provider.options.key || ''] = provider;
};

Auth.prototype.removeProvider = function (key) {
	delete this.providers[key];
};

Auth.prototype.setAuthorizationFunc = function (f) {
	this.authorizationFunc = f;
};

Auth.prototype.handleRequest = function (ctx) {
	this.auth(ctx);
};

Auth.prototype.auth = function (ctx) {
	var authData = null;
	if (this.adapter != null) {
		authData = this.adapter.extractAuthData(ctx);
	}
	var provider = this.getProvider(ctx, authData);
	if (provider == null || !this.isAllowedProvider(ctx, authData, provider)) {
		this.onNoAuthData(ctx);
	}
	else {
		if (authData == null || provider.adapter != this.adapter && !provider.options.reuseMainAuthData) {
			authData = provider.adapter.extractAuthData(ctx);
		}
		var self = this;
		provider.authByData(authData, ctx, {
			allowUnprotected: this.options.allowUnprotected,
			renewalMode: this.options.renewalMode
		}, function (err, result) {
			if (err != null) {
				self.onAuthError(ctx, provider, err);
			}
			else {
				self.onAuthResult(ctx, provider, result);
			}
		});
	}
};

Auth.prototype.getProvider = function (ctx, authData) {
	var key = this.adapter.extractProviderKey(ctx, authData);
	return this.providers[key];
};

Auth.prototype.isAllowedProvider = function (ctx, authData, provider) {
	var allowedProviderTypesDict = this.options.allowedProviderTypesDict;
	return allowedProviderTypesDict == null || allowedProviderTypesDict[provider.type];
};

Auth.prototype.onAuthError = function (ctx, provider, err) {
	if (provider.isAuthProblem(err)) {
		if (err.code == 'NoAuthData') {
			this.onNoAuthData(ctx);
		}
		else if (err.code == 'UnexpectedIdentity') {
			ctx.error(new UnexpectedIdentity());
		}
		else {
			ctx.error(new errors.AuthRequired());
		}
	}
	else {
		ctx.error(err);
	}
};

Auth.prototype.onNoAuthData = function (ctx) {
	if (ctx.transportCtx != null) {
		ctx.auth = ctx.transportCtx.auth;
		ctx.next();
	}
	else if (this.options.isOptional) {
		ctx.next();
	}
	else {
		this.onAuthRequired(ctx);
	}
};

Auth.prototype.onAuthResult = function (ctx, provider, result) {
	ctx.auth = this.createCtxAuth(ctx, provider, result);
	if (this.authorizationFunc != null) {
		var self = this;
		this.authorizationFunc(ctx, function (err, isAuthorized) {
			if (err != null) {
				ctx.error(err);
			}
			else {
				self.onAuthorizationResult(ctx, isAuthorized);
			}
		});
	}
	else {
		ctx.next();
	}
};

Auth.prototype.onAuthorizationResult = function (ctx, isAuthorized) {
	if (isAuthorized) {
		ctx.next();
	}
	else {
		this.onNotAuthorized(ctx);
	}
};

Auth.prototype.onAuthRequired = function (ctx) {
	ctx.error(new errors.AuthRequired());
};

Auth.prototype.onNotAuthorized = function (ctx) {
	ctx.error(new errors.Forbidden());
};

Auth.prototype.createCtxAuth = function (ctx, provider, authResult) {
	var result = {
		type: provider.type,
		identity: this.getIdentity(ctx, provider, authResult),
		authResult: authResult
	};
	if (provider.options.allowOnBehalf && this.options.allowOnBehalf) {
		var onBehalf = this.createOnBehalfResult(ctx, result);
		if (onBehalf != null) {
			var via = result;
			result = onBehalf;
			result.via = via;
		}
	}
	return result;
};

Auth.prototype.getIdentity = function (ctx, provider, authResult) {
	return this.parseIdentity(authResult.tokenData.identityStr);
};

Auth.prototype.parseIdentity = function (identityStr) {
	return identityStr;
};

Auth.prototype.parseOnBehalfIdentity = function (identityStr) {
	return this.parseIdentity(identityStr);
};

Auth.prototype.createOnBehalfResult = function (ctx, ctxAuth) {
	var result = null;
	var onBehalfData = this.adapter.extractOnBehalfData(ctx, ctxAuth);
	if (onBehalfData != null) {
		result = {
			type: onBehalfData.type || this.options.defaultOnBehalfAuthType,
			identity: this.parseOnBehalfIdentity(onBehalfData.identityStr),
			onBehalfData: onBehalfData
		};
	}
	return result;
};

Auth.prototype.restrictTo = function () {
	var types = (arguments.length > 0 ? Array.prototype.slice.call(arguments) : null);
	this.options.allowedProviderTypes = types;
	this.options.allowedProviderTypesDict = (types == null ? null : types.reduce(function (prev, curr) { prev[curr] = true; return prev; }, {}));
	return this;
};

Auth.prototype.setRenewal = function (renewalMode) {
	this.options.renewalMode = renewalMode;
	return this;
};

Object.defineProperties(Auth.prototype, {
	opt: {
		get: function () {
			this.options.isOptional = true;
			return this;
		}
	},
	required: {
		get: function () {
			this.options.isOptional = false;
			return this;
		}
	},
	unprotected: {
		get: function () {
			this.options.allowUnprotected = true;
			return this;
		}
	},
	protectedOnly: {
		get: function () {
			this.options.allowUnprotected = false;
			return this;
		}
	},
	skipRenewal: {
		get: function () {
			this.options.renewalMode = 'skip';
			return this;
		}
	},
	forceRenewal: {
		get: function () {
			this.options.renewalMode = 'force';
			return this;
		}
	},
	autoRenewal: {
		get: function () {
			this.options.renewalMode = null;
			return this;
		}
	},
	allowOnBehalf: {
		get: function () {
			this.options.allowOnBehalf = true;
			return this;
		}
	},
	directOnly: {
		get: function () {
			this.options.allowOnBehalf = false;
			return this;
		}
	}
});


module.exports = Auth;

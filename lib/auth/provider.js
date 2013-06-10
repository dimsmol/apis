"use strict";
var inherits = require('util').inherits;
var AuthProvider = require('authen/lib/auth_provider');


var Provider = function (opt_options) {
	AuthProvider.call(this, opt_options);
	this.type = null;
};
inherits(Provider, AuthProvider);


Provider.prototype.prepareAuthResult = function (ctx, options, authResult, cb) {
	var result = {
		type: this.type,
		identity: this.getIdentity(ctx, authResult),
		authResult: authResult
	};
	if (options.allowOnBehalf && this.options.allowOnBehalf) {
		var onBehalf = this.createOnBehalfResult(ctx, result);
		if (onBehalf != null) {
			var via = result;
			result = onBehalf;
			result.via = via;
		}
	}
	cb(null, result);
};

Provider.prototype.getIdentity = function (ctx, authResult) {
	return this.parseIdentity(authResult.tokenData.identityStr);
};

Provider.prototype.parseIdentity = function (identityStr) {
	return identityStr;
};

Provider.prototype.parseOnBehalfIdentity = function (identityStr) {
	return this.parseIdentity(identityStr);
};

Provider.prototype.createOnBehalfResult = function (ctx) {
	var result = null;
	var onBehalfData = this.adapter.extractOnBehalfData(ctx);
	if (onBehalfData != null) {
		result = {
			type: onBehalfData.type || this.options.defaultOnBehalfAuthType,
			identity: this.parseOnBehalfIdentity(onBehalfData.identityStr),
			onBehalfData: onBehalfData
		};
	}
	return result;
};


module.exports = Provider;

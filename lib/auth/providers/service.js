"use strict";
var inherits = require('util').inherits;
var AuthProvider = require('authen/lib/auth_provider');


var ServiceAuthProvider = function (opt_options) {
	AuthProvider.call(this, opt_options);
};
inherits(ServiceAuthProvider, AuthProvider);


ServiceAuthProvider.prototype.prepareAuthResult = function (ctx, options, authResult, cb) {
	var result = {
		type: this.type,
		identity: this.getIdentity(authResult),
		authResult: result
	};
	if (options.allowOnBehalf && this.options.allowOnBehalf) {
		var onBehalf = this.createOnBehalfResult(ctx);
		if (onBehalf != null) {
			var via = result;
			result = onBehalf;
			result.via = via;
		}
	}
	cb(null, result);
};

ServiceAuthProvider.prototype.unpackOnBehalfIdentity = function (identityStr) {
	return identityStr;
};

ServiceAuthProvider.prototype.createOnBehalfResult = function (ctx) {
	var result = null;
	var onBehalfData = this.adapter.extractOnBehalfData(ctx);
	if (onBehalfData != null) {
		result = {
			type: onBehalfData.type || this.options.defaultOnBehalfAuthType,
			identity: this.unpackOnBehalfIdentity(onBehalfData.identityStr),
			onBehalfData: onBehalfData
		};
	}
	return result;
};


module.exports = ServiceAuthProvider;

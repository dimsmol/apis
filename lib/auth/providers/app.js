"use strict";
var inherits = require('util').inherits;
var AuthProvider = require('authen/lib/auth_provider');


var AppAuthProvider = function (opt_options) {
	AuthProvider.call(this, opt_options);
};
inherits(AppAuthProvider, AuthProvider);


AppAuthProvider.prototype.packIdentity = function (identity) {
	return JSON.stringify([identity.service, identity.user]);
};

AppAuthProvider.prototype.unpackIdentity = function (identityStr) {
	var parsed = JSON.parse(identityStr);
	return {
		service: parsed[0],
		user: parsed[1]
	};
};

AppAuthProvider.prototype.prepareAuthResult = function (ctx, options, authResult, cb) {
	var identity = this.getIdentity(authResult);
	var result = {
		type: identity.authType || this.defaultAuthType,
		identity: identity.user,
		via: {
			type: this.type,
			identity: identity.service,
			authResult: authResult
		}
	};
	cb(null, result);
};


module.exports = AppAuthProvider;

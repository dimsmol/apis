"use strict";
var mt = require('marked_types');
var ops = require('ops');
var WebError = require('./errors').WebError;


var Authenticator = function (opt_auth) {
	this.auth = opt_auth;
};

Authenticator.prototype.canAuthenticate = function () {
	return this.isAuthenticated();
};

Authenticator.prototype.setAuth = function (auth) {
	this.auth = auth;
};

Authenticator.prototype.isAuthenticated = function () {
	return this.auth != null && Date.now() < this.auth.issued + this.auth.maxAge;
};

Authenticator.prototype.sendAuthenticated = function (transport, path, method, headers, data, opt_options, opt_cb) {
	headers = this.addAuthTokenHeader(headers);
	var self = this;
	transport.send(path, method, headers, data, opt_options, function (err, result) {
		self.applyRenewal(err, result);
		if (opt_cb != null) {
			opt_cb(err, result);
		}
	});
};

Authenticator.prototype.addAuthTokenHeader = function (headers) {
	headers = headers || {};
	headers.auth = headers.auth || {};
	headers.auth.token = this.auth.token;
	headers.auth.expected = this.auth.expected;
	return headers;
};

Authenticator.prototype.applyRenewal = function (err, result) {
	if (err != null) {
		result = null;
		// WebError can contain raw result
		if (mt.is(err, WebError) && err.result != null) {
			result = err.result;
		}
	}
	if (result != null && result.headers != null && result.headers.renewal != null) {
		this.auth = result.headers.renewal;
	}
};


module.exports = Authenticator;

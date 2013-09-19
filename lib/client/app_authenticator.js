"use strict";
var mt = require('marked_types');
var ops = require('ops');
var WebError = require('./errors').WebError;


var AppAuthenticator = function (authTransport, options) {
	this.authTransport = authTransport;
	this.options = ops.cloneWithDefaults(options, this.getDefaultOptions());

	this.auth = null;
};

AppAuthenticator.prototype.getDefaultOptions = function () {
	return {
		maxAuthAttempts: 10,
		request: {
			path: '/service/appToken',
			method: 'create'
		}
	};
};

AppAuthenticator.prototype.canAuthenticate = function () {
	return this.isAuthenticated() || this.authTransport.authenticator != null && this.authTransport.authenticator.canAuthenticate();
};

AppAuthenticator.prototype.isAuthenticated = function () {
	return this.auth != null && Date.now() < this.auth.issued + this.auth.maxAge;
};

AppAuthenticator.prototype.authenticate = function (cb) {
	var request = this.options.request;
	var self = this;
	this.authTransport.sendAuthenticated(request.path, request.method, request.headers,
		request.data, request.options,
		function (err, result) {
			if (err != null) {
				cb(err);
			}
			else {
				self.auth = result.data;
				cb();
			}
		});
};

AppAuthenticator.prototype.ensureAuthenticated = function (cb) {
	if (!this.isAuthenticated()) {
		this.authenticate(cb);
	}
	else {
		cb();
	}
};

AppAuthenticator.prototype.sendAuthenticated = function (transport, path, method, headers, data, opt_options, opt_cb) {
	var self = this;
	this.callAuthenticated(
		function (cb) {
			headers = self.addAuthTokenHeader(headers);
			transport.send(path, method, headers, data, opt_options, opt_cb);
		},
		function (err, result) {
			self.applyRenewal(err, result);
			if (opt_cb != null) {
				opt_cb(err, result);
			}
		});
};

AppAuthenticator.prototype.addAuthTokenHeader = function (headers) {
	headers = headers || {};
	headers.auth = headers.auth || {};
	headers.auth.token = this.auth.token;
	return headers;
};

AppAuthenticator.prototype.callAuthenticated = function (f, cb) {
	this.callAuthenticatedInternal(1, f, cb);
};

AppAuthenticator.prototype.callAuthenticatedInternal = function (attempt, f, cb) {
	var self = this;
	this.ensureAuthenticated(function (err) {
		if (err != null) {
			cb(err);
		}
		else {
			f(function (err, result) {
				if (err != null && err.status == 401 && attempt < self.options.maxAuthAttempts) {
					self.callAuthenticatedInternal(attempt + 1, f, cb);
				}
				else {
					cb(err, result);
				}
			});
		}
	});
};

AppAuthenticator.prototype.applyRenewal = function (err, result) {
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


module.exports = AppAuthenticator;

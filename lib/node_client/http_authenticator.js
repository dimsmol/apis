"use strict";
var mt = require('marked_types');
var ops = require('ops');
var WebError = require('./web_error');


var HttpAuthenticator = function (http, options) {
	this.http = http;
	this.options = ops.cloneWithDefaults(options, this.getDefaultOptions());

	this.auth = null;
};

HttpAuthenticator.prototype.getDefaultOptions = function () {
	return {
		maxAuthAttempts: 10,
		login: {
			//data: {id, password, passwordKey}, // required
			path: '/service/login',
			method: 'call'
		}
	};
};

HttpAuthenticator.prototype.isAuthenticated = function () {
	return this.auth != null && Date.now() < this.auth.issued + this.auth.maxAge;
};

HttpAuthenticator.prototype.authenticate = function (cb) {
	var login = this.options.login;
	var self = this;
	this.http.send(login.path, login.method, login.headers,
		login.data, login.options,
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

HttpAuthenticator.prototype.ensureAuthenticated = function (cb) {
	if (!this.isAuthenticated()) {
		this.authenticate(cb);
	}
	else {
		cb();
	}
};

HttpAuthenticator.prototype.sendAuthenticated = function (path, method, headers, data, options, cb) {
	var self = this;
	this.callAuthenticated(
		function (cb) {
			headers = self.addAuthTokenHeader(headers);
			self.http.send(path, method, headers, data, options, cb);
		},
		function (err, result) {
			self.applyRenewal(err, result);
			cb(err, result);
		});
};

HttpAuthenticator.prototype.addAuthTokenHeader = function (headers) {
	headers = headers || {};
	headers.auth = headers.auth || {};
	headers.auth.token = this.auth.token;
	return headers;
};

HttpAuthenticator.prototype.callAuthenticated = function (f, cb) {
	this.callAuthenticatedInternal(1, f, cb);
};

HttpAuthenticator.prototype.callAuthenticatedInternal = function (attempt, f, cb) {
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

HttpAuthenticator.prototype.applyRenewal = function (err, result) {
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


module.exports = HttpAuthenticator;

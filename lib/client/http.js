"use strict";
var HttpAdapter = require('../node_client/http_adapter');
var WebError = require('./errors').WebError;
var Authenticator = require('./authenticator');
var HttpRequest = require('./http_request');
var JsonpRequest = require('./jsonp_request');
var errors = require('./errors');


var Http = function (opt_baseUri, opt_options) {
	this.baseUri = opt_baseUri;
	this.options = opt_options || {};
	this.adapter = null;
	this.authenticator = null;
};

Http.prototype.setAdapter = function (adapter) {
	this.adapter = adapter;
};

Http.prototype.setAuthenticator = function (authenticator) {
	this.authenticator = authenticator;
};

Http.prototype.setAuth = function (auth) {
	this.ensureAuthenticator();
	this.authenticator.setAuth(auth);
};

Http.prototype.ensureAuthenticator = function () {
	if (this.authenticator == null) {
		this.authenticator = this.createAuthenticator();
	}
};

Http.prototype.createAuthenticator = function () {
	return new Authenticator();
};

Http.prototype.sendAuthenticated = function (path, method, headers, data, options, cb) {
	this.ensureAuthenticator();
	this.authenticator.sendAuthenticated(this, path, method, headers, data, options, cb);
};

Http.prototype.sendAuthenticatedIfPossible = function (path, method, headers, data, options, cb) {
	this.ensureAuthenticator();
	if (this.authenticator.canAuthenticate()) {
		this.sendAuthenticated(path, method, headers, data, options, cb);
	}
	else {
		this.send(path, method, headers, data, options, cb);
	}
};

Http.prototype.send = function (path, method, headers, data, options, cb) {
	this.ensureAdapter();
	var result;
	if (options == null || options.crossDomain == null) {
		result = this.sendHttp(path, method, headers, data, options, cb);
	}
	else {
		switch (options.crossDomain) {
			case 'jsonp':
				result = this.sendJsonp(path, method, headers, data, options, cb);
				break;
			default:
				throw new Error('Unsupported crossDomain option ' + options.crossDomain);
		}
	}
	return result;
};

// internal

Http.prototype.ensureAdapter = function () {
	if (this.adapter == null) {
		this.adapter = this.createAdapter(this.options.adapter);
	}
};

Http.prototype.createAdapter = function (opt_options) {
	return new HttpAdapter(opt_options);
};

Http.prototype.sendHttp = function (path, method, headers, data, options, cb) {
	var req = this.adapter.createRequestData(this.baseUri, path, method, headers, data, options);
	var self = this;
	return HttpRequest.send(req, options, function (err, result) {
		self.handleHttpResult(err, result, options, cb);
	});
};

Http.prototype.sendJsonp = function (path, method, headers, data, options, cb) {
	var url = this.adapter.createRequestUrl(this.baseUri, path, method, headers, data, options);
	var self = this;
	return JsonpRequest.send(url, options, function (err, result) {
		self.handleResult(err, result, options, cb);
	});
};

Http.prototype.handleHttpResult = function (err, httpResult, options, cb) {
	var result;
	if (err == null) {
		result = this.adapter.parseResponseData(httpResult.status, httpResult.headers, httpResult.body, options);
	}
	this.handleResult(err, result, options, cb);
};

Http.prototype.handleResult = function (err, result, options, cb) {
	if (err == null) {
		err = WebError.extract(result);
	}
	if (err != null) {
		cb(err);
	}
	else {
		cb(err, result);
	}
};


module.exports = Http;

"use strict";
var hyperquest = require('hyperquest');
var HttpAdapter = require('./http_adapter');
var HttpAuthenticator = require('./http_authenticator');
var WebError = require('./web_error');


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

Http.prototype.sendAuthenticated = function (path, method, headers, data, options, cb) {
	this.ensureAuthenticator();
	this.authenticator.sendAuthenticated(path, method, headers, data, options, cb);
};

Http.prototype.send = function (path, method, headers, data, options, cb) {
	this.ensureAdapter();
	var req = this.adapter.createRequestData(this.baseUri, path, method, headers, data, options);
	var r = hyperquest(req.url, {
		method: req.method,
		headers: req.headers
	});
	if (req.body != null) {
		r.end(req.body);
	}

	var res;
	var body = '';
	var self = this;
	r.on('data', function (buf) {
		body += buf;
	});
	r.on('response', function (r) {
		res = r;
	});
	r.on('error', function (err) {
		self.handleHttpResult(err, null, options, cb);
	});
	r.on('end', function () {
		self.handleHttpResult(null, {
			status: res.statusCode,
			headers: res.headers,
			body: body
		}, options, cb);
	});

	return r;
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

Http.prototype.ensureAuthenticator = function () {
	if (this.authenticator == null) {
		this.authenticator = this.createAuthenticator(this.options.auth);
	}
};

Http.prototype.createAuthenticator = function (options) {
	return new HttpAuthenticator(this, options);
};

Http.prototype.handleHttpResult = function (err, httpResult, options, cb) {
	var result;
	if (err == null) {
		result = this.adapter.parseResponseData(httpResult.status, httpResult.headers, httpResult.body, options);
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

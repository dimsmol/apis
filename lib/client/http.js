"use strict";
var HttpAdapter = require('../node_client/http_adapter');
var HttpRequest = require('./http_request');
var JsonpRequest = require('./jsonp_request');
var errors = require('./errors');


var Http = function (opt_baseUri, opt_options) {
	this.baseUri = opt_baseUri;
	this.options = opt_options || {};
	this.adapter = null;
};

Http.prototype.setAdapter = function (adapter) {
	this.adapter = adapter;
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
		self.handleJsonpResult(err, result, options, cb);
	});
};

Http.prototype.handleHttpResult = function (err, httpResult, options, cb) {
	var result;
	if (err == null) {
		result = this.adapter.parseResponseData(httpResult.status, httpResult.headers, httpResult.body, options);
		err = this.extractError(result);
	}
	cb(err, result);
};

Http.prototype.handleJsonpResult = function (err, result, options, cb) {
	if (err == null) {
		err = this.extractError(result);
	}
	cb(err, result);
};

Http.prototype.extractError = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new errors.WebError(result);
	}
	return err;
};


module.exports = Http;

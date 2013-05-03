"use strict";
var errors = require('./errors');


var HttpRequest = function (http, path, method, headers, data, options, cb) {
	this.http = http;
	this.options = options || {};
	this.path = path;
	this.method = method;
	this.headers = headers || {};
	this.data = data;
	this.cb = cb;

	this.url = null;
	this.body = null;
	this.transport = null;
	this.isAborted = false;
	this.timeout = null;
};

HttpRequest.prototype.methodHttpHeaderName = 'X-Method';
HttpRequest.prototype.authHttpHeaderName = 'X-Auth';
HttpRequest.prototype.authExpectedHttpHeaderName = 'X-AuthExpected';
HttpRequest.prototype.authRenewalHttpHeaderName = 'X-AuthRenewal';
HttpRequest.prototype.authRenewalIssuedHttpHeaderName = 'X-AuthRenewalIssued';
HttpRequest.prototype.authRenewalMaxAgeHttpHeaderName = 'X-AuthRenewalMaxAge';

HttpRequest.prototype.bodyUrlKey = 'body';
HttpRequest.prototype.xdomainUrlKey = 'xdomain';

HttpRequest.prototype.defaultContentType = 'application/json';

HttpRequest.prototype.send = function () {
	this.createTimeout();
	this.url = this.createUrl();
	this.body = this.createBody();
	this.transport = this.createTransport();
	this.createCallback();
	this.sendInternal();
	return this;
};

HttpRequest.prototype.abort = function () {
	this.isAborted = true;
	this.clearTimeout();
	if (this.transport != null) {
		this.transport.onreadystatechange = null;
		this.transport.abort();
	}
};

HttpRequest.prototype.createTimeout = function () {
	var timeout = this.options.timeout;
	if (timeout != null) {
		var self = this;
		this.timeout = setTimeout(function () {
			self.handleTimeout();
		}, timeout);
	}
};

HttpRequest.prototype.handleTimeout = function () {
	this.abort();
	this.cb(new errors.TimeoutError());
};

HttpRequest.prototype.clearTimeout = function () {
	if (this.timeout != null) {
		clearTimeout(this.timeout);
	}
};

HttpRequest.prototype.createUrl = function () {
	var result = this.path;
	if (this.http.baseUri) {
		result = this.http.baseUri + this.path;
	}
	return result;
};

HttpRequest.prototype.createBody = function () {
	var result;
	if (this.data === undefined) {
		result = '';
	}
	else {
		result = JSON.stringify(this.data);
	}
	return result;
};

HttpRequest.prototype.createTransport = function () {
	return new XMLHttpRequest();
};

HttpRequest.prototype.createCallback = function () {
	var self = this;
	// NOTE use onload/onerror pair instead of
	// onreadystatechange in future (will break IE8 support)
	this.transport.onreadystatechange = function() {
		if(self.transport.readyState == 4) {
			self.transport.onreadystatechange = null;
			if (self.isNetworkError()) {
				self.handleNetworkError();
			}
			else {
				self.handleResponse();
			}
		}
	};
};

HttpRequest.prototype.isNetworkError = function () {
	// NOTE works incorrectly with file:// protocol
	return !this.transport.status;
};

HttpRequest.prototype.handleNetworkError = function () {
	this.clearTimeout();
	this.cb(new errors.NetworkError());
};

HttpRequest.prototype.sendInternal = function () {
	if (this.method == 'get') {
		this.sendGet();
	}
	else {
		this.sendPost();
	}
};

HttpRequest.prototype.sendGet = function () {
	this.transport.open('GET', this.createGetUrl());
	this.setHttpHeaders();
	this.transport.send();
};

HttpRequest.prototype.createGetUrl = function () {
	var parts = this.createGetUrlParts();
	var result = this.url;
	if (parts.length > 0) {
		result += '?' + parts.join('&');
	}
	return result;
};

HttpRequest.prototype.createGetUrlParts = function (opt_parts) {
	var parts = opt_parts || [];
	if (this.body) {
		parts.push(this.bodyUrlKey + '=' + encodeURIComponent(this.body));
	}
	return parts;
};

HttpRequest.prototype.sendPost = function () {
	var transport = this.transport;
	transport.open('POST', this.url);
	this.setContentTypeHttpHeader();
	this.setMethodHttpHeader();
	this.setHttpHeaders();
	transport.send(this.body);
};

HttpRequest.prototype.setHttpHeaders = function () {
	var headers = this.createHttpHeaders();
	var transport = this.transport;
	for (var k in headers) {
		transport.setRequestHeader(k, headers[k]);
	}
};

HttpRequest.prototype.createHttpHeaders = function () {
	var headers = this.headers;
	var result = headers.http || {};
	delete headers.http;
	if (headers.auth != null) {
		if (headers.auth.token) {
			result[this.authHttpHeaderName] = headers.auth.token;
			if (headers.auth.expected) {
				result[this.authExpectedHttpHeaderName] = headers.auth.expected;
			}
		}
	}
	return result;
};

HttpRequest.prototype.setContentTypeHttpHeader = function () {
	var contentType = this.headers.http && this.headers.http['Content-type'] || this.headers.contentType || this.defaultContentType;
	this.transport.setRequestHeader('Content-type', contentType);
};

HttpRequest.prototype.setMethodHttpHeader = function () {
	if (this.method != 'create') {
		this.transport.setRequestHeader(this.methodHttpHeaderName, this.method);
	}
};

HttpRequest.prototype.handleResponse = function () {
	this.clearTimeout();
	var result = this.createResult();
	var err = this.extractError(result);
	if (err != null) {
		this.cb(err);
	}
	else {
		this.cb(null, result);
	}
};

HttpRequest.prototype.createResult = function () {
	var result = {
		headers: this.getResultHeaders(),
		data: this.getResultData()
	};
	var status = this.getResultStatus();
	if (status != null) {
		result.status = status;
	}
	var transport = this.getTransportForResult();
	if (transport != null) {
		result.transport = transport;
	}
	return result;
};

HttpRequest.prototype.getTransportForResult = function () {
	return this.transport;
};

HttpRequest.prototype.getResultStatus = function () {
	return this.transport.status;
};

HttpRequest.prototype.getResultHeaders = function () {
	var result = {};
	var authRenewalToken = this.transport.getResponseHeader(this.authRenewalHttpHeaderName);
	if (authRenewalToken) {
		var renewal = {
			token: authRenewalToken
		};
		result.authRenewal = renewal;
		var issued = this.transport.getResponseHeader(this.authRenewalIssuedHttpHeaderName);
		if (issued) {
			renewal.issued = new Date(issued);
		}
		var maxAge = this.transport.getResponseHeader(this.authRenewalMaxAgeHttpHeaderName);
		if (maxAge) {
			renewal.maxAge = parseInt(maxAge, 10);
		}
	}
	return result;
};

HttpRequest.prototype.getResultData = function () {
	var body = this.getResultBody();
	return body ? JSON.parse(body) : undefined;
};

HttpRequest.prototype.getResultBody = function () {
	return this.transport.responseText;
};

HttpRequest.prototype.extractError = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new errors.WebError(result);
	}
	return err;
};


module.exports = HttpRequest;

define(['./errors'],
function (errors) {
"use strict";

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
	this.engine = null;
};

HttpRequest.prototype.methodHeaderName = 'X-Method';

HttpRequest.prototype.headersUrlKey = 'headers';
HttpRequest.prototype.bodyUrlKey = 'body';
HttpRequest.prototype.xdomainUrlKey = 'xdomain';

HttpRequest.prototype.canUseHttpHeaders = true;

HttpRequest.prototype.send = function () {
	this.url = this.createUrl();
	this.httpHeaders = this.createHttpHeaders();
	this.body = this.createBody();
	this.engine = this.createEngine();
	this.createCallback();
	this.sendInternal();
	return this;
};

HttpRequest.prototype.createUrl = function () {
	var result = this.path;
	if (this.http.baseUri) {
		result = this.http.baseUri + this.path;
	}
	return result;
};

HttpRequest.prototype.createHttpHeaders = function () {
	var result = null;
	if (this.canUseHttpHeaders) {
		var headers = this.headers;
		result = headers.http || {};
		delete headers.http;
		if (headers.auth) {
			result['X-Auth'] = headers.auth;
		}
		if (headers.authExpected) {
			result['X-AuthExpected'] = headers.authExpected;
		}
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

HttpRequest.prototype.createEngine = function () {
	return new XMLHttpRequest();
};

HttpRequest.prototype.createCallback = function () {
	var self = this;
	this.engine.onreadystatechange = function() {
		if(self.engine.readyState == 4) {
			self.engine.onreadystatechange = null;
			self.handleResponse();
		}
	};
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
	this.engine.open('GET', this.createGetUrl());
	this.setHttpHeaders();
	this.engine.send();
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
	if (!this.canUseHttpHeaders) {
		var headers = this.headers;
		if (this.method != 'get') {
			headers = headers || {};
			headers.method = this.method;
		}
		if (headers) {
			parts.push(this.headersUrlKey + '=' + encodeURIComponent(JSON.stringify(headers)));
		}
	}
	if (this.body) {
		parts.push(this.bodyUrlKey + '=' + encodeURIComponent(this.body));
	}
	return parts;
};

HttpRequest.prototype.sendPost = function () {
	var engine = this.engine;
	engine.open('POST', this.url);
	this.setContentTypeHeader();
	this.setMethodHeader();
	this.setHttpHeaders();
	engine.send();
};

HttpRequest.prototype.setHttpHeaders = function () {
	if (this.canUseHttpHeaders) {
		var headers = this.httpHeaders;
		if (headers != null) {
			var engine = this.engine;
			for (var k in headers) {
				engine.setRequestHeader(k, headers[k]);
			}
		}
	}
};

HttpRequest.prototype.setContentTypeHeader = function () {
	this.engine.setRequestHeader('Content-type', this.headers.contentType || 'application/json');
};

HttpRequest.prototype.setMethodHeader = function () {
	if (this.method != 'create') {
		this.engine.setRequestHeader(this.methodHeaderName, this.method);
	}
};

HttpRequest.prototype.handleResponse = function () {
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
	return {
		transport: this.engine,
		status: this.engine.status,
		headers: this.extractHeaders(),
		data: this.extractData()
	};
};

HttpRequest.prototype.extractHeaders = function () {
	var result = {};
	var authRenewalToken = this.engine.getResponseHeader('X-AuthRenewal');
	if (authRenewalToken) {
		var renewal = {
			token: authRenewalToken
		};
		result.authRenewal = renewal;
		var issued = this.engine.getResponseHeader('X-AuthRenewalIssued');
		if (issued) {
			renewal.issued = new Date(issued);
		}
		var maxAge = this.engine.getResponseHeader('X-AuthRenewalMaxAge');
		if (maxAge) {
			renewal.maxAge = parseInt(maxAge, 10);
		}
	}
	return result;
};

HttpRequest.prototype.extractData = function () {
	return JSON.parse(this.engine.responseText);
};

HttpRequest.prototype.extractError = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new errors.WebError(result);
	}
	return err;
};


return HttpRequest;

});

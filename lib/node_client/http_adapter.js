"use strict";
var ops = require('ops');


var HttpAdapter = function (opt_options) {
	this.options = ops.cloneWithDefaults(opt_options, this.getDefaultOptions());
};

HttpAdapter.prototype.getDefaultOptions = function () {
	return {
		transform: {
			headers: {
				req: {
					method: 'X-Method',
					contentType: 'Content-type',
					auth: {
						token: 'X-Auth',
						expected: 'X-AuthExpected'
					}
				},
				res: {
					renewal: {
						token: 'X-AuthRenewal',
						issued: 'X-AuthRenewalIssued',
						maxAge: 'X-AuthRenewalMaxAge'
					}
				}
			},
			url: {
				headers: 'headers',
				body: 'body'
			}
		},
		defaultContentType: 'application/json'
	};
};

HttpAdapter.prototype.createRequestData = function (base, path, method, headers, data, options) {
	var httpMethod = this.createMethod(method, options);
	var body = this.createBody(data, options);

	var hasBody = body && this.canHaveBody(httpMethod, options);
	var httpHeaders = this.createHeaders(method, headers, hasBody, options);

	var urlParts = null;
	if (!hasBody && body) {
		urlParts = {
			body: body
		};
		body = null;
	}

	var url = this.createUrl(base, path, urlParts, options);

	return {
		url: url,
		method: httpMethod,
		headers: httpHeaders,
		body: body
	};
};

HttpAdapter.prototype.createRequestUrl = function (base, path, method, headers, data, options) {
	if (method != 'get') {
		headers = headers || {};
		headers.method = method;
	}
	return this.createUrl(base, path, {
		headers: this.stringifyHeaders(headers, options),
		body: this.createBody(data, options)
	}, options);
};

HttpAdapter.prototype.parseResponseData = function (status, headers, body, options) {
	if (headers.constructor === Object) {
		headers = {
			get: function (k) {
				return headers[k];
			}
		};
	}
	return {
		status: status,
		headers: this.parseHeaders(headers, options),
		data: this.parseBody(body, options)
	};
};

// internal

// create

HttpAdapter.prototype.canHaveBody = function (httpMethod, options) {
	return httpMethod != 'GET' && httpMethod != 'HEAD';
};

HttpAdapter.prototype.createUrl = function (base, path, urlParts, options) {
	var result = [base, path];
	if (urlParts != null) {
		var query = this.createQuery(urlParts, options);
		if (query) {
			result.push('?', query);
		}
	}
	return result.join('');
};

HttpAdapter.prototype.createMethod = function (method, options) {
	return ({
		get: 'GET',
		head: 'HEAD',
		options: 'OPTIONS'
	}[method]) || 'POST';
};

HttpAdapter.prototype.createQuery = function (urlParts, options) {
	var result = [];
	var urlKeys = this.options.transform.url;
	for (var k in urlParts) {
		var part = urlParts[k];
		if (part) {
			var urlKey = urlKeys[k];
			if (urlKey) {
				result.push(this.createQueryItem(urlKeys[k], part));
			}
		}
	}
	return result.length > 0 ? result.join('&') : null;
};

HttpAdapter.prototype.createQueryItem = function (k, v) {
	return [k, encodeURIComponent(v)].join('=');
};

HttpAdapter.prototype.createHeaders = function (method, headers, hasBody, options) {
	headers = headers || {};
	var result = {};
	if (headers.http) {
		for (var k in headers.http) {
			result[k] = headers.http[k];
		}
	}
	var keys = this.options.transform.headers.req;
	if (method != 'get' && method != 'head' && method != 'create' && method != 'options') {
		result[keys.method] = method;
	}
	this.applyHeaders(keys, result, headers, options);
	if (hasBody && !headers[keys.contentType]) {
		result[keys.contentType] = this.options.defaultContentType;
	}
	return result;
};

HttpAdapter.prototype.applyHeaders = function (keys, httpHeaders, headers, options) {
	if (headers.contentType) {
		httpHeaders[keys.contentType] = headers.contentType;
	}
	if (headers.auth != null) {
		this.applyAuthHeaders(keys.auth, httpHeaders, headers.auth, options);
	}
};

HttpAdapter.prototype.applyAuthHeaders = function (keys, httpHeaders, authHeaders, options) {
	if (authHeaders.token) {
		httpHeaders[keys.token] = authHeaders.token;
		if (authHeaders.expected) {
			httpHeaders[keys.expected] = authHeaders.expected;
		}
	}
};

HttpAdapter.prototype.stringifyHeaders = function (headers, options) {
	var result = null;
	if (headers != null) {
		var http = headers.http;
		if (http) {
			delete headers.http;
		}
		result = JSON.stringify(headers);
		if (http) {
			headers.http = http;
		}
	}
	return result;
};

HttpAdapter.prototype.createBody = function (data, options) {
	var result;
	if (data !== undefined) {
		result = JSON.stringify(data);
	}
	return result;
};

// parse

HttpAdapter.prototype.parseHeaders = function (headers, options) {
	var result = {};
	var keys = this.options.transform.headers.res;
	var renewal = this.parseRenewalHeaders(keys.renewal, headers, options);
	if (renewal) {
		result.renewal = renewal;
	}
	return result;
};

HttpAdapter.prototype.parseRenewalHeaders = function (keys, headers, options) {
	var result = null;
	var token = headers.get(keys.token);
	if (token) {
		result = {
			token: token
		};
		var issued = parseInt(headers.get(keys.issued), 10);
		if (!isNaN(issued)) {
			result.issued = issued;
		}
		var maxAge = parseInt(headers.get(keys.maxAge), 10);
		if (!isNaN(maxAge)) {
			result.maxAge = maxAge;
		}
	}
	return result;
};

HttpAdapter.prototype.parseBody = function (body) {
	return body ? JSON.parse(body) : undefined;
};


module.exports = HttpAdapter;

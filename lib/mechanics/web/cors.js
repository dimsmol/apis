"use strict";
var Cors = function (ctx) {
	this.ctx = ctx;

	var settings = ctx.appSettings.core.web.cors;

	this.isEnabled = !settings.disabled;
	this.maxAge = settings.maxAge;
	this.allowCredentials = settings.allowCredentials;

	this.restrictToOrigins = settings.restrictToOrigins;

	this.origin = null;
	this.methods = null;
	this.headers = null;
	this.exposeHeaders = null;
};

// according to http://www.w3.org/TR/cors/#simple-header
Cors.prototype.simpleHeaders = {
	'cache-control': true,
	'content-language': true,
	'content-type': true,
	'expires': true,
	'last-modified': true,
	'pragma': true
};

Cors.prototype.init = function () {
};

Cors.prototype.onBeforeResponse = function () {
	if (this.isEnabled) {
		this.setResponseHeaders();
	}
};

Cors.prototype.getOrigin = function () {
	var result = this.origin;
	if (result == null) {
		result = this.getDefaultOrigin();
	}
	return result;
};

Cors.prototype.getDefaultOrigin = function () {
	return this.ctx.req.headers.origin;
};

Cors.prototype.getMethods = function () {
	var result = this.methods;
	if (result == null) {
		result = this.getDefaultMethods();
	}
	return result;
};

Cors.prototype.getDefaultMethods = function () {
	// TODO resource methods instead of requested by default
	// (for better caching)
	var method = this.ctx.req.header('access-control-request-method');
	return method ? [method] : [];
};

Cors.prototype.getHeaders = function () {
	var result = this.headers;
	if (result == null) {
		result = this.getDefaultHeaders();
	}
	return result;
};

Cors.prototype.getDefaultHeaders = function () {
	var result = [];
	var headers = this.ctx.req.header('access-control-request-headers');
	if (headers) {
		result = headers.split(/\s*,\s*/);
	}
	return result;
};

Cors.prototype.getExposeHeaders = function () {
	var result = this.exposeHeaders;
	if (result == null) {
		result = this.getDefaultExposeHeaders();
	}
	return result;
};

Cors.prototype.getDefaultExposeHeaders = function () {
	var result = [];
	// WARN undocumented feature usage
	// can become broken at any moment
	for (var k in this.ctx.res._headers) {
		var lowerK = k.toLowerCase();
		if (!(lowerK in this.simpleHeaders) && lowerK.indexOf('access-control-') !== 0) {
			result.push(k);
		}
	}
	return result;
};

Cors.prototype.isOriginItemAllowed = function (originItem) {
	var result = false;
	if (this.restrictToOrigins == null) {
		result = true;
	}
	else {
		for (var i = 0; i < this.restrictToOrigins.length; i++) {
			var originRule = this.restrictToOrigins[i];
			if (originRule.constructor === RegExp) {
				result = originRule.test(originItem);
			}
			else {
				result = (originRule == originItem);
			}
			if (result) {
				break;
			}
		}
	}
	return result;
};

Cors.prototype.isOriginAllowed = function (origin) {
	var result = false;
	if (origin) {
		if (this.restrictToOrigins == null) {
			result = true;
		}
		else {
			var origins = origin.trim().toLowerCase().split(/\s+/);
			for (var i = 0; i < origins.length; i++) {
				if (this.isOriginItemAllowed(origins[i])) {
					result = true;
					break;
				}
			}
		}
	}
	return result;
};

Cors.prototype.setResponseHeaders = function () {
	var ctx = this.ctx;
	var reqOrigin = ctx.req.headers.origin;
	if (this.isOriginAllowed(reqOrigin)) {
		var res = ctx.res;
		var req = ctx.req;

		var origin = this.getOrigin();
		res.setHeader('Access-Control-Allow-Origin', origin);
		if (this.allowCredentials && origin != '*') {
			res.setHeader('Access-Control-Allow-Credentials', true);
		}

		if (ctx.req.method == 'OPTIONS') {
			res.setHeader('Access-Control-Max-Age', this.maxAge);

			var methods = this.getMethods();
			if (methods.length > 0) {
				res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
			}

			var headers = this.getHeaders();
			if (headers.length > 0) {
				res.setHeader('Access-Control-Allow-Headers', headers.join(', '));
			}
		}
		else {
			var exposeHeaders = this.getExposeHeaders();
			if (exposeHeaders.length > 0) {
				res.setHeader('Access-Control-Expose-Headers', exposeHeaders.join(', '));
			}
		}
	}
};


module.exports = Cors;

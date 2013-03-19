"use strict";
var HttpRequest = require('./http_request');
var JsonpRequest = require('./jsonp_request');


var Http = function (opt_baseUri) {
	this.baseUri = opt_baseUri;
};

Http.prototype.send = function (path, method, headers, data, options, cb) {
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

Http.prototype.sendHttp = function (path, method, headers, data, options, cb) {
	return new HttpRequest(this, path, method, headers, data, options, cb).send();
};

Http.prototype.sendJsonp = function (path, method, headers, data, options, cb) {
	return new JsonpRequest(this, path, method, headers, data, options, cb).send();
};


module.exports = Http;

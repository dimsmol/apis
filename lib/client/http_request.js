"use strict";
var NetworkError = require('./errors').NetworkError;


var HttpRequest = function (opt_options) {
	this.isAborted = false;
	this.xhr = null;
	this.cb = null;
};

HttpRequest.prototype.send = function (req, cb) {
	this.cb = cb;
	var xhr = new XMLHttpRequest();
	this.xhr = xhr;
	var self = this;
	xhr.onreadystatechange = function() {
		if(xhr.readyState == 4) {
			xhr.onreadystatechange = null;
			if (!self.isAborted) {
				self.handleResult();
			}
		}
	};
	xhr.open(req.method, req.url);
	for (var k in req.headers) {
		xhr.setRequestHeader(k, req.headers[k]);
	}
	xhr.send(req.body);
};

HttpRequest.prototype.abort = function () {
	this.isAborted = true;
	this.xhr.onreadystatechange = null;
	this.xhr.abort();
};

HttpRequest.prototype.handleResult = function () {
	var xhr = this.xhr;
	if (!xhr.status) {
		this.cb(new NetworkError());
	}
	else {
		this.cb(null, {
			status: xhr.status,
			headers: {
				get: function (k) {
					return xhr.getResponseHeader(k);
				}
			},
			body: xhr.responseText
		});
	}
};

HttpRequest.send = function (req, options, cb) {
	var instance = new HttpRequest(options);
	instance.send(req, cb);
	return instance;
};


module.exports = HttpRequest;

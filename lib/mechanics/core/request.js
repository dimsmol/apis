"use strict";
var Request = function (headers, body) {
	this.headers = headers || {};
	this.body = body;
	this.data = null;
};

Request.prototype.header = function (name) {
	return this.headers[name];
};

Object.defineProperties(Request.prototype, {
	path: {
		get: function () {
			return this.headers.path;
		}
	},
	method: {
		get: function () {
			return this.headers.method;
		}
	}
});

Request.prototype.hasData = false;


module.exports = Request;

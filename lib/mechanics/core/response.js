"use strict";
var Response = function () {
	this.statusCode = null;
	this.headers = {};
};

// header access methods just to be similar to http res,
// you can freely use res.headers directly
Response.prototype.getHeader = function (name) {
	return this.headers[name];
};

Response.prototype.setHeader = function (name, value) {
	this.headers[name] = value;
};

Response.prototype.removeHeader = function (name) {
	delete this.headers[name];
};


module.exports = Response;

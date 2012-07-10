"use strict";
var WebCtx = function (mechanics, req, res) {
	this.mechanics = mechanics;
	this.req = req;
	this.res = res;

	this.hasBody = false;
	this.isBodyParsed = false;
	this.transport = mechanics.transport;
};

WebCtx.prototype.sendResult = function (status, result, opt_headers) {
	this.transport.sendResult(this, status, result, opt_headers);
};


module.exports = WebCtx;

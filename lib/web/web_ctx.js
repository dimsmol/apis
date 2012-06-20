"use strict";
var WebCtx = function (mechanics, req, res) {
	this.mechanics = mechanics;
	this.req = req;
	this.res = res;

	this.hasBody = false;
	this.isBodyParsed = false;
	this.transport = mechanics.transport;
};

WebCtx.prototype.sendResult = function (status, result) {
	this.transport.sendResult(this, status, result);
};


module.exports = WebCtx;

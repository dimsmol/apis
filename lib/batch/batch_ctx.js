"use strict";
var BatchCtx = function (mechanics, request) {
	this.mechanics = mechanics;
	this.request = request;

	this.parentCtx = mechanics.ctx;
	this.headers = request.headers;
	this.hasBody = true;
	this.isBodyParsed = true;
	this.body = mechanics.prepareRequestData(request);
};

BatchCtx.prototype.sendResult = function (status, result) {
	this.mechanics.storeResult(this.request, status, result);
};


module.exports = BatchCtx;

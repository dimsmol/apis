"use strict";
var BatchCtx = function (mechanics, request) {
	this.mechanics = mechanics;
	this.request = request;

	this.parentCtx = mechanics.ctx;
	this.header = request.header;
	this.hasBody = true;
	this.isBodyParsed = true;
	this.body = request.body;
};

BatchCtx.prototype.sendResult = function (status, result) {
	this.mechanics.storeResult(this.request.name, status, result);
};


module.exports = BatchCtx;

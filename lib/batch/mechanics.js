"use strict";
var Ctx = require('../ctx');
var BatchCtx = require('./batch_ctx');


var Mechanics = function (ctx, contract) {
	this.ctx = ctx;
	this.contract = contract;

	this.requests = ctx.data;
	this.requestIdx = 0;
	this.results = {};
};

Mechanics.prototype.next = function () {
	if (this.requestIdx >= this.requests.length) {
		this.ctx.result(this.results);
	}
	else {
		var request = this.requests[this.requestIdx];
		this.processRequest(request);
	}
};

Mechanics.prototype.processRequest = function (request) {
	var ctx = this.createRequestCtx(request);
	this.contract.handle(ctx);
};

Mechanics.prototype.createRequestCtx = function (request) {
	var self = this;
	var ctx = new Ctx(this.ctx.units, request.header.path, request.header.method, function (err) {
		self.handleResult(ctx, err);
	});
	ctx.mechanicsCtx = new BatchCtx(this, request);
	return ctx;
};

Mechanics.prototype.storeResult = function (name, status, result) {
	this.results[name] = {
		header: { status: status },
		result: result
	};
};

Mechanics.prototype.handleResult = function (ctx, err) {
	if (err != null && !ctx.isResponseSend) {
		this.sendResult(ctx.mechanicsCtx.request.name, 500, err);
	}

	this.requestIdx++;
	this.next();
};


module.exports = Mechanics;

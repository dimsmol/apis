"use strict";
var Ctx = require('../ctx');
var BatchCtx = require('./batch_ctx');


var Mechanics = function (ctx, contract, applierClass) {
	this.ctx = ctx;
	this.contract = contract;
	this.applierClass = applierClass;

	this.requests = ctx.data;
	this.requestIdx = 0;
	this.results = [];
	this.resultsDict = {};
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
	var ctx = new Ctx(this.ctx.units, request.headers.path, function (err) {
		self.handleResult(ctx, err);
	});
	ctx.mechanicsCtx = new BatchCtx(this, request);
	return ctx;
};

Mechanics.prototype.storeResult = function (request, status, result) {
	var name = request.name;
	var resultToStore = {
		name: name,
		headers: { status: status },
		data: result
	};
	this.results.push(resultToStore);
	this.resultsDict[name] = resultToStore;
};

Mechanics.prototype.handleResult = function (ctx, err) {
	if (err != null && !ctx.isResponseSend) {
		// shouldn't happen, actually
		this.storeResult(ctx.mechanicsCtx.request.name, 500, { message: 'Internal server error' });
	}

	this.requestIdx++;
	this.next();
};

Mechanics.prototype.prepareRequestData = function (request) {
	var data = request.data;
	if (request.apply) {
		var applier = new this.applierClass(request, this.resultsDict);
		data = applier.applyToData();
	}
	return data;
};


module.exports = Mechanics;

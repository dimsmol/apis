"use strict";
var Ctx = require('../../ctx');
var Request = require('./request');
var Response = require('../core/response');


var Mechanics = function (ctx, contract, applierClass) {
	this.ctx = ctx;
	this.applierClass = applierClass;

	this.units = ctx.mechanics.units; // need it for child ctx
	this.contract = contract;

	this.requests = ctx.data;
	this.requestIdx = 0;
	this.results = [];
	this.resultsDict = {};
};

Mechanics.prototype.isHttp = false;
Mechanics.prototype.isBatch = true;

Mechanics.prototype.handle = function () {
	this.next();
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
	var req = new Request(request);
	var res = new Response(this);
	var ctx = new Ctx(this, req, res, function (err) {
		self.handleResult(ctx, err);
	});
	ctx.transportCtx = this.ctx;
	return ctx;
};

Mechanics.prototype.storeResult = function (ctx, result) {
	var name = ctx.req.name;
	var headers = ctx.res.headers;
	headers.status = ctx.res.statusCode;
	var resultToStore = {
		name: name,
		headers: headers,
		data: result
	};
	this.results.push(resultToStore);
	this.resultsDict[name] = resultToStore;
};

Mechanics.prototype.handleResult = function (ctx, err) {
	if (err != null && !ctx.isResponseSend) {
		// shouldn't happen, actually
		// error is already logged by ctx at this point
		ctx.res.statusCode = 500;
		this.sendResult(ctx, { message: 'Internal server error' });
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

Mechanics.prototype.sendResult = function (ctx, result) {
	this.storeResult(ctx, result);
};


module.exports = Mechanics;

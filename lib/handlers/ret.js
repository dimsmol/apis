"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');
var Result = require('./result');


var Ret = function (dataSpec) {
	this.resultHandler = this.createResultHandler(dataSpec);
	this.impl = null;
	this.implIsSync = false;
};
inherits(Ret, Handler);

Ret.prototype.name = 'Ret';

Ret.prototype.createResultHandler = function (dataSpec) {
	return new Result(dataSpec);
};

Ret.prototype.setImpl = function (impl, isSync) {
	if (this.impl == null) {
		this.impl = impl;
		this.implIsSync = isSync;
	}
	else {
		throw new Error('Impl already set');
	}
};

Ret.prototype.setup = function (handlerContainer) {
	if (handlerContainer.setRet) {
		handlerContainer.setRet(this);
	}
};

Ret.prototype.handleRequest = function (ctx) {
	ctx.enter([this.resultHandler]);

	if (this.impl == null) {
		ctx.result(null);
	}
	else if (this.implIsSync) {
		var catched = false;
		var result = null;

		try {
			result = this.impl(ctx);
		}
		catch (exc) {
			catched = true;
			ctx.error(exc);
		}

		if (!catched) {
			ctx.result(result);
		}
	}
	else {
		this.impl(ctx);
	}
};

Ret.prototype.handleError = function (ctx) {
	ctx.enter([this.resultHandler]);
	ctx.next();
};

Ret.ret = function (dataSpec) {
	return new Ret(dataSpec);
};


module.exports = Ret;

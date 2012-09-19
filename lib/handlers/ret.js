"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var Handler = require('./core/handler');
var Result = require('./result');

var isNull = valid.validators.isNull;


var Ret = function (dataSpec) {
	Handler.call(this);

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
	var info = handlerContainer.info;
	if (info) {
		if (info.core.ret) {
			throw new Error('Multiple Ret within handler container');
		}
		else {
			info.core.ret = this;
		}
	}
};

Ret.prototype.handleRequest = function (ctx) {
	ctx.enter([this.resultHandler]);

	if (this.impl == null) {
		ctx.result(null);
	}
	else if (this.implIsSync) {
		var err = null;
		var result = null;

		try {
			result = this.impl(ctx);
		}
		catch (implErr) {
			err = implErr;
		}

		if (err) {
			ctx.error(err);
		} else {
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

Object.defineProperties(Ret.ret, {
	none: {
		get: function () {
			return Ret.ret(isNull);
		}
	}
});


module.exports = Ret;

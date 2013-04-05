"use strict";
var inherits = require('util').inherits;
var valid = require('valid');
var Handler = require('./core/handler');
var Result = require('./result');

var validators = valid.validators;
var any = validators.any;
var isNull = validators.isNull;
var str = validators.str;


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
		throw new Error('Impl is already set');
	}
};

Ret.prototype.containerSetup = function (container) {
	if (container != null && container.info != null) {
		var info = container.info;
		if (info.core != null && info.core.ret != null) {
			throw new Error('Multiple Ret within handler container');
		}
		else {
			info.core = info.core || {};
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
	any: {
		get: function () {
			return Ret.ret(any);
		}
	},
	none: {
		get: function () {
			return Ret.ret(isNull);
		}
	},
	str: {
		get: function () {
			return Ret.ret(str);
		}
	}
});


module.exports = Ret;

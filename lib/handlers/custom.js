"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Custom = function (opt_handleRequestFunc, opt_handleErrorFunc, opt_setupFunc) {
	Handler.call(this);

	this.handleRequestFunc = opt_handleRequestFunc;
	this.handleErrorFunc = opt_handleErrorFunc;
	this.setupFunc = opt_setupFunc;
};
inherits(Custom, Handler);

Custom.prototype.name = 'Custom';

Custom.prototype.setup = function (handlerContainer) {
	if (this.setupFunc) {
		return this.setupFunc(handlerContainer);
	}
};

Custom.prototype.handleRequest = function (ctx) {
	if (this.handleRequestFunc) {
		this.handleRequestFunc(ctx);
	}
	else {
		Custom.super_.prototype.handleRequest.call(this, ctx);
	}
};

Custom.prototype.handleError = function (ctx) {
	if (this.handleErrorFunc) {
		this.handleErrorFunc(ctx);
	}
	else {
		Custom.super_.prototype.handleError.call(this, ctx);
	}
};

Custom.custom = function (opt_handleRequestFunc, opt_handleErrorFunc, opt_setupFunc) {
	return new Custom(opt_handleRequestFunc, opt_handleErrorFunc, opt_setupFunc);
};

Custom.custom.both = function (handleFunc, opt_setupFunc) {
	return new Custom(handleFunc, handleFunc, opt_setupFunc);
};

Custom.custom.req = function (handleRequestFunc, opt_setupFunc) {
	return new Custom(handleRequestFunc, null, opt_setupFunc);
};

Custom.custom.err = function (handleErrorFunc, opt_setupFunc) {
	return new Custom(null, handleErrorFunc, opt_setupFunc);
};

Custom.custom.setup = function (setupFunc) {
	return new Custom(null, null, setupFunc);
};


module.exports = Custom;

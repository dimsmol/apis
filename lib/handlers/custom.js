"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Custom = function (opt_handleRequestFunc, opt_handleErrorFunc, opt_containerSetupFunc) {
	Handler.call(this);

	this.handleRequestFunc = opt_handleRequestFunc;
	this.handleErrorFunc = opt_handleErrorFunc;
	this.containerSetupFunc = opt_containerSetupFunc;
};
inherits(Custom, Handler);

Custom.prototype.name = 'Custom';

Custom.prototype.containerSetup = function (container) {
	if (this.containerSetupFunc) {
		return this.containerSetupFunc(container);
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

Custom.custom = function (opt_handleRequestFunc, opt_handleErrorFunc, opt_containerSetupFunc) {
	return new Custom(opt_handleRequestFunc, opt_handleErrorFunc, opt_containerSetupFunc);
};

Custom.custom.both = function (handleFunc, opt_containerSetupFunc) {
	return new Custom(handleFunc, handleFunc, opt_containerSetupFunc);
};

Custom.custom.req = function (handleRequestFunc, opt_containerSetupFunc) {
	return new Custom(handleRequestFunc, null, opt_containerSetupFunc);
};

Custom.custom.err = function (handleErrorFunc, opt_containerSetupFunc) {
	return new Custom(null, handleErrorFunc, opt_containerSetupFunc);
};

Custom.custom.containerSetup = function (containerSetupFunc) {
	return new Custom(null, null, containerSetupFunc);
};


module.exports = Custom;

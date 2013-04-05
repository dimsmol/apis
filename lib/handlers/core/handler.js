"use strict";
var Handler = function () {
};

Handler.prototype.name = 'Handler';

Handler.prototype.toString = function () {
	return ['[', this.name, ']'].join('');
};

Handler.prototype.handle = function (ctx) {
	if (ctx.hasError) {
		this.handleError(ctx);
	}
	else {
		this.handleRequest(ctx);
	}
};

Handler.prototype.handleRequest = function (ctx) {
	ctx.next();
};

Handler.prototype.handleError = function (ctx) {
	ctx.next();
};

Handler.prototype.handlerSetup = function (handlerContainer) {
	// returning null will exclude handler
	return this;
};


module.exports = Handler;

"use strict";
var Handler = function () {
};

Handler.prototype.name = 'Handler';
Handler.prototype.isSetupOnly = false;

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

Handler.prototype.containerSetup = function (container) {
};


module.exports = Handler;

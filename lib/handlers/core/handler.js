"use strict";
var Handler = function () {
};

Handler.prototype.name = 'Handler';
Handler.prototype.isSetupOnly = false;

Handler.prototype.toString = function () {
	return ['[', this.name, ']'].join('');
};

Handler.prototype.handle = function (ctx) {
	this.handleInternal(ctx);
};

Handler.prototype.handleInternal = function (ctx) {
	var result;

	if (ctx.hasError) {
		this.handleError(ctx);
	}
	else {
		// NOTE useless here, but used in HandlerSync
		result = this.handleRequest(ctx);
	}

	return result;
};

Handler.prototype.handleRequest = function (ctx) {
	ctx.next();
};

Handler.prototype.handleError = function (ctx) {
	ctx.next();
};

Handler.prototype.setup = function (handlerContainer) {
};


module.exports = Handler;

"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Chain = function () {
	Handler.call(this);

	this.handlers = [];
	this.info = { // can contain flags set by handlers
		core: {} // reserved for apis handlers
	};
};
inherits(Chain, Handler);

Chain.prototype.name = 'Chain';

Chain.prototype.handleRequest = function (ctx) {
	ctx.enter(this.handlers);
	ctx.next();
};

Chain.prototype.add = function (handler) {
	handler = this.toHandler(handler);
	if (handler != null) {
		if (handler.containerSetup != null) {
			handler.containerSetup(this);
		}
		if (!handler.isSetupOnly) {
			this.handlers.push(handler);
		}
	}
};

Chain.prototype.addHandlers = function (handlers) {
	for (var i = 0; i < handlers.length; i++) {
		this.add(handlers[i]);
	}
};

Chain.prototype.toHandler = function (handler) {
	var toHandler = require('./core/to_handler');
	return toHandler(handler);
};

Chain.chain = function (opt_handlers) {
	var result = new Chain();
	if (opt_handlers != null) {
		result.addHandlers(opt_handlers);
	}
	return result;
};


module.exports = Chain;

"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');
var Custom = require('./custom');


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
	handler = Chain.resolveHandler(handler, this);
	if (handler != null) {
		this.handlers.push(handler);
	}
};

Chain.chain = function () {
	return new Chain();
};

Chain.resolveHandler = function (handler, opt_container) {
	var result = null;
	if (handler != null) {
		if (Array.isArray(handler)) {
			result = new Chain();
			for (var i = 0; i < handler.length; i++) {
				result.add(handler[i]);
			}
		}
		else if (handler.constructor === Function) {
			result = new Custom(handler);
		}
		else {
			result = handler;
		}

		if (result.handlerSetup != null) {
			result = result.handlerSetup(opt_container);
		}
	}
	return result;
};


module.exports = Chain;

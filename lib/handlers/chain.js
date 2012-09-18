"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Chain = function (resource) {
	this.resource = resource;

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
	if (handler != null) {
		handler.setup(this);
		if (!handler.isSetupOnly) {
			this.handlers.push(handler);
		}
	}
};

Chain.chain = function (resource) {
	return new Chain(resource);
};


module.exports = Chain;

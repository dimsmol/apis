var inherits = require('util').inherits;

var Handler = require('./handler');


var Chain = function (resource) {
	this.resource = resource;

	this.handlers = [];
	this.ret = null;
};
inherits(Chain, Handler);

Chain.prototype.handle = function (ctx) {
	ctx.handlers.enter(this.handlers);
	ctx.next();
};

Chain.prototype.add = function (handler) {
	handler.setup(this);
	this.handlers.push(handler);
};


module.exports = Chain;

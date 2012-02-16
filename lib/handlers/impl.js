var inherits = require('util').inherits;

var Handler = require('./handler');


var Impl = function (f) {
	this.impl = f;
};
inherits(Impl, Handler);

Impl.prototype.setup = function (chain) {
	chain.impl = this.impl;
	return false;
};


var impl = function (f) {
	return new Impl(f);
};


module.exports = {
	Impl: Impl,
	impl: impl
};

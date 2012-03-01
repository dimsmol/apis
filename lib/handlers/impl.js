var inherits = require('util').inherits;

var Handler = require('./handler');


var Impl = function (implFunc, isSync) {
	this.impl = implFunc;
	this.isSync = isSync;
};
inherits(Impl, Handler);

Impl.prototype.setup = function (chain) {
	if (chain.ret)
	{
		chain.ret.setImpl(this.impl, this.isSync);
	}
	else
	{
		throw new Error('Impl without Ret');
	}
};


var impl = function (implFunc, isSync) {
	return new Impl(implFunc, isSync);
};

var impls = function (implFunc) {
	return impl(implFunc, true);
};


module.exports = {
	Impl: Impl,
	impl: impl,
	impls: impls
};

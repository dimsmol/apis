"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Impl = function (implFunc, isSync) {
	this.impl = implFunc;
	this.isSync = isSync;
};
inherits(Impl, Handler);

Impl.prototype.name = 'Impl';

Impl.prototype.setup = function (handlerContainer) {
	var found = false;
	if (handlerContainer.getRet)
	{
		var ret = handlerContainer.getRet();
		if (ret)
		{
			found = true;
			ret.setImpl(this.impl, this.isSync);
		}
	}

	if (!found)
	{
		throw new Error('Impl requires Ret');
	}
};


Impl.impl = function (implFunc, isSync) {
	return new Impl(implFunc, isSync);
};

Impl.impls = function (implFunc) {
	return Impl.impl(implFunc, true);
};


module.exports = Impl;

"use strict";
var inherits = require('util').inherits;

var InternalError = require('../errors').InternalError;
var Handler = require('./handler');


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
		throw new InternalError('Impl requires Ret');
	}
};


Impl.impl = function (implFunc, isSync) {
	return new Impl(implFunc, isSync);
};

Impl.impls = function (implFunc) {
	return Impl.impl(implFunc, true);
};


module.exports = Impl;

"use strict";
var inherits = require('util').inherits;
var Handler = require('./core/handler');


var Impl = function (implFunc, isSync) {
	Handler.call(this);

	this.impl = implFunc;
	this.isSync = isSync;
};
inherits(Impl, Handler);

Impl.prototype.name = 'Impl';
Impl.prototype.isSetupOnly = true;

Impl.prototype.containerSetup = function (container) {
	var found = false;
	var info = container.info;
	if (info != null && info.core != null) {
		var ret = info.core.ret;
		if (ret != null) {
			found = true;
			ret.setImpl(this.impl, this.isSync);
		}
	}

	if (!found) {
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

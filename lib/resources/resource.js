"use strict";
var MethodNotAllowed = require('../errors').MethodNotAllowed;
var Chain = require('../handlers/chain');
var MethodMapper = require('./method_mapper');


var Resource = function (path, handlers) {
	if (arguments.length == 1) { // got all in one
		handlers = path;
		path = handlers.path;
	}

	this.path = path;

	this.handlers = {};
	for (var method in handlers) {
		var handler = this.prepareHandler(handlers[method]);
		if (handler != null) {
			this.handlers[method] = handler;
		}
	}

	this.methodMapper = this.createMethodMapper();
};

Resource.prototype.createMethodMapper = function () {
	return new MethodMapper(this.handlers);
};

Resource.prototype.prepareHandler = function (handlers) {
	if (handlers == null) {
		return null;
	}
	var result = new Chain(this);
	for (var i = 0; i < handlers.length; i++) {
		result.add(handlers[i]);
	}
	return result;
};

Resource.prototype.resolve = function (ctx) {
	var result = null;

	if (this.path == ctx.path || !this.path && !ctx.path) {
		var method = this.methodMapper.resolveMethod(ctx);
		result = this.handlers[method];

		if (result == null) {
			throw new MethodNotAllowed(this.methodMapper.methods, this.methodMapper.httpMethods);
		}
	}

	return result;
};

Resource.res = function (path, handlers) {
	if (arguments.length == 1) {
		handlers = path;
		path = null;
	}

	return new Resource(path, handlers);
};


module.exports = Resource;

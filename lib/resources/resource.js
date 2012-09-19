"use strict";
var valid = require('valid');
var MethodNotAllowed = require('../errors').MethodNotAllowed;
var Chain = require('../handlers/chain');
var impls = require('../handlers/impl').impls;
var ret = require('../handlers/ret').ret;
var MethodMapper = require('./method_mapper');


var Resource = function (path, handlers) {
	this.path = path;

	this.handlers = {};
	for (var method in handlers) {
		var handler = this.prepareHandler(handlers[method]);
		if (handler != null) {
			this.handlers[method] = handler;
		}
	}

	if (!('options' in this.handlers)) {
		this.handlers.options = this.createDefaultOptionsHandler();
	}

	this.methodMapper = this.createMethodMapper();
};

Resource.prototype.createDefaultOptionsHandler = function () {
	var self = this;
	return this.prepareHandler([
		ret(valid.validators.any),

			impls(function (ctx) {
				if (ctx.isHttp) {
					ctx.res.setHeader('Allow', self.methodMapper.httpMethods.join(', '));
				}

				return {
					allowedMethods: self.methodMapper.methods
				};
			})
	]);
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
		else {
			ctx.method = method;
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

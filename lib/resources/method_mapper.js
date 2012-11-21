"use strict";
var MethodMapper = function (handlers) {
	this.methods = [];
	this.map = {};

	var httpMethods = {};

	for (var method in handlers) {
		this.methods.push(method);

		var httpMethod = this.logicToHttpMap[method];
		if (httpMethod == null) {
			throw new Error('Unknown method "' + method + '"');
		}

		if (httpMethod != 'POST' || method == this.logicDefaultForPost) {
			if (httpMethod in this.map) {
				throw new Error('Ambigous mapping');
			}
			this.map[httpMethod] = method;
		}
		httpMethods[httpMethod] = true;
	}

	this.httpMethods = Object.keys(httpMethods);
};

// NOTE http methods
// POST (call, create) - repeated request can create undesired copy or have some other side effect
// GET - must not modify data
// HEAD - same result as GET, but without body
// PUT (update) - can be safely repeated
// DELETE (del) - can be safely repeated

// do we need HEAD as 'get' subvariant ?
MethodMapper.prototype.logicToHttpMap = {
	call: 'POST',
	create: 'POST',
	get: 'GET',
	update: 'PUT',
	del: 'DELETE',
	options: 'OPTIONS'
};

MethodMapper.prototype.logicDefaultForPost = 'create';

MethodMapper.prototype.resolveMethod = function (ctx) {
	var result = null;
	var method = ctx.req.method;
	if (ctx.isHttp) {
		if (method == 'POST') {
			var key = ctx.appSettings.core.web.headers.nameMethod.toLowerCase();
			var subMethod = ctx.req.headers[key];
			if (subMethod) {
				result = subMethod;
			}
		}
		if (result == null) {
			result = this.map[method];
		}
	}
	else {
		result = method;
	}
	return result;
};


module.exports = MethodMapper;

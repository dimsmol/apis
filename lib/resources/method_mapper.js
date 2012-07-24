"use strict";
var MethodMapper = function (handlers) {
	this.methods = [];
	this.httpMethods = [];
	this.map = {};

	var multiplePostCandidates = false;

	for (var method in handlers) {
		this.methods.push(method);

		var httpMethod = this.logicToHttpMap[method];
		if (httpMethod == null) {
			throw new Error('Unknown method "' + method + '"');
		}

		var existingMethod = this.map[httpMethod];
		if (existingMethod == null) {
			this.map[httpMethod] = method;
			this.httpMethods.push(httpMethod);
		}
		else if (httpMethod == 'POST') {
			multiplePostCandidates = true;
			if (existingMethod != this.logicDefaultForPost) {
				this.map[httpMethod] = method;
			}
		}
		else {
			throw new Error('Unambigous mapping');
		}
	}
	if (multiplePostCandidates && this.map.POST != this.logicDefaultForPost) {
		// ensure no direct mapping for POST provided
		// if there is no default candidate and there are more than one non-default
		delete this.map.POST;
	}
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
	del: 'DELETE'
};

MethodMapper.prototype.logicDefaultForPost = 'create';

MethodMapper.prototype.resolveMethod = function (ctx) {
	var result = null;
	var mechanicsCtx = ctx.mechanicsCtx;
	if (mechanicsCtx.headers != null) {
		result = mechanicsCtx.headers.method;
	}
	else if (mechanicsCtx.req != null) {
		var method = mechanicsCtx.req.method;
		if (method == 'POST') {
			var req = ctx.mechanicsCtx.req;
			if (req != null) {
				var subMethod = req.query.method;
				if (subMethod) {
					result = subMethod;
				}
			}
		}
		if (result == null) {
			result = this.map[method];
		}
	}
	return result;
};


module.exports = MethodMapper;

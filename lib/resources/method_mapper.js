"use strict";
var MethodMapper = function (handlers) {
	this.methods = [];
	this.httpMethods = [];
	this.map = {};
	this.postSubstitutesMap = {};
	var postSubstitutesCount = 0;

	for (var method in handlers) {
		this.methods.push(method);
		var httpMethod = this.logicToHttpMap[method];
		if (httpMethod == null) {
			throw new Error('Unknown method "' + method + '"');
		}
		this.httpMethods.push(httpMethod);
		this.map[method] = method;
		if (httpMethod != 'POST' && this.map[httpMethod] != null) {
			throw new Error('Unambigous mapping');
		}
		this.map[httpMethod] = method;
		if (this.potentialPostSubstitutesMap[method]) {
			this.postSubstitutesMap[method] = true;
			postSubstitutesCount++;
		}
	}
	// ensure POST is mapped to default if present
	if (this.map[this.logicDefaultForPost] != null) {
		this.map.POST = this.logicDefaultForPost;
	}
	else if (postSubstitutesCount > 1) {
		// ensure no direct mapping for POST provided if there are more than one non-default candidate
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

// we need ability to provide body with GET and DELETE, which HTTP doesn't allow
// so such queries are substituted with POST
// NOTE this map must not include logicDefaultForPost value
MethodMapper.prototype.potentialPostSubstitutesMap = {
	call: true,
	get: true,
	del: true
};

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
				if (this.postSubstitutesMap[subMethod]) {
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

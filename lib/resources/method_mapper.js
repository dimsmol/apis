"use strict";
var MethodMapper = function () {
	this.methodMap = null;
	this.logicalMethods = null;

	this.fillMethodMap();
	this.fillLogicalMethods();
};

MethodMapper.prototype.fillMethodMap = function () {
	this.methodMap = {
		POST: 'create', // repeated request can create undesired copy
		GET: 'get', // doesn't modify data
		PUT: 'update', // can be safely repeated
		DELETE: 'del' // can be safely repeated
	};
};

MethodMapper.prototype.fillLogicalMethods = function () {
	var result = {};

	for (var k in this.methodMap)
	{
		result[this.methodMap[k]] = null;
	}

	this.logicalMethods = result;
};

MethodMapper.prototype.getLogicalMethod = function (ctx) {
	var method = ctx.method;

	if (method in this.logicalMethods)
	{
		return method;
	}

	return this.methodMap[method];
};


module.exports = MethodMapper;

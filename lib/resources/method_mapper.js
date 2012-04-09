"use strict";
var MethodMapper = function () {
	this.methodMap = null;
	this.logicalMethods = null;

	this.fillMethodMap();
	this.fillLogicalMethods();
};

MethodMapper.prototype.fillMethodMap = function () {
	this.methodMap = {
		GET: 'get',
		POST: 'update',
		DELETE: 'del'
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

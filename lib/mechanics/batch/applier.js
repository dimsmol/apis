"use strict";
var isSuccess = require('../../tools/http').isSuccess;


var Applier = function (request, results) {
	this.request = request;
	this.results = results;

	this.items = request.apply || [];
	this.data = request.data;
};

Applier.prototype.applyToData = function () {
	for (var i = 0; i < this.items.length; i++) {
		var item = this.items[i];
		for (var path in item) {
			var expression = item[path];
			this.applyDatum(path, this.execute(expression));
		}
	}
	return this.data;
};

Applier.prototype.applyDatum = function (path, datum) {
	var data = this.data || {};
	var pathParts = path.split('.');
	var last = pathParts.length - 1;
	for (var i = 0; i <= last; i++) {
		var part = pathParts[i];
		if (i == last) {
			data[part] = datum;
		}
		else if (data[part] == null) {
			data[part] = {};
		}
	}
};

Applier.prototype.execute = function (expression) {
	var expr = this.splitExpr(expression);
	var args = expr.args;
	var result = [];
	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		var parts = arg.split('.');
		var resultKey = parts.shift();
		var batchResult = this.results[resultKey];
		if (batchResult.data != null && isSuccess(batchResult.headers.status)) {
			var func = this.createCollectingFunc(parts, expr.action);
			this.traverse(result, batchResult.data, func);
		}
	}
	return result;
};

Applier.prototype.traverse = function (result, src, func) {
	for (var i = 0; i < src.length; i++) {
		func(result, src[i]);
	}
};

Applier.prototype.createCollectingFunc = function (pathItems, action) {
	var actionFunc = Applier.actionFuncs[action];
	return function (result, obj) {
		return actionFunc(result, function () {
			return Applier.pickByPath(obj, pathItems);
		});
	};
};

Applier.prototype.splitExpr = function (expression) {
	var result = {};
	for (var k in expression) {
		result.action = k;
		result.args = expression[k];
		break;
	}
	return result;
};

Applier.pickByPath = function (obj, pathItems) {
	for (var i = 0; i < pathItems.length; i++) {
		if (obj == null) {
			break;
		}
		obj = obj[pathItems[i]];
	}
	return obj;
};

Applier.actionFuncs = {
	$collect: function (result, pickerFunc) {
		var picked = pickerFunc();
		if (picked) {
			result.push(picked);
		}
	},
	$join: function (result, pickerFunc) {
		var picked = pickerFunc();
		if (picked) {
			result.push.apply(result, picked);
		}
	}
};


module.exports = Applier;

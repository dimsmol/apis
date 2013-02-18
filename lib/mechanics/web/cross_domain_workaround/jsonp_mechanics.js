"use strict";
var inherits = require('util').inherits;
var MechanicsBase = require('./mechanics_base');

var JsonpMechanics = function (ctx, callback) {
	MechanicsBase.call(this, ctx, callback);
};
inherits(JsonpMechanics, MechanicsBase);

JsonpMechanics.prototype.isJsonp = true;

JsonpMechanics.prototype.sendResponseResult = function (ctx, responseResult) {
	var body = [
		this.callback, '(', JSON.stringify(responseResult), ');'
	].join('');
	this.sendResponse(this.ctx, 'text/javascript', body);
};


module.exports = JsonpMechanics;

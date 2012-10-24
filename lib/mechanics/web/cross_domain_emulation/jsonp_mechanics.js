"use strict";
var inherits = require('util').inherits;
var MechanicsBase = require('./mechanics_base');

var JsonpMechanics = function (ctx, callback) {
	MechanicsBase.call(this, ctx, callback);
};
inherits(JsonpMechanics, MechanicsBase);

JsonpMechanics.prototype.isJsonp = true;

JsonpMechanics.prototype.sendResponseResult = function (ctx, responseResult) {
	this.ctx.mechanics.sendJsonpResult(this.ctx, responseResult, this.callback);
};


module.exports = JsonpMechanics;

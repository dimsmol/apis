"use strict";
var inherits = require('util').inherits;
var MechanicsBase = require('./mechanics_base');

var FrameMechanics = function (ctx, callback) {
	MechanicsBase.call(this, ctx, callback);
};
inherits(FrameMechanics, MechanicsBase);

FrameMechanics.prototype.isFrame = true;

FrameMechanics.prototype.sendResponseResult = function (ctx, responseResult) {
	this.ctx.mechanics.sendFrameResult(this.ctx, responseResult, this.callback);
};


module.exports = FrameMechanics;

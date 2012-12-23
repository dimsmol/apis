"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var UnitSet = require('units').UnitSet;


var AppBase = function (opt_options) {
	this.options = opt_options || {};

	this.isInited = false;
	this.units = null;
};
inherits(AppBase, Unit);

AppBase.prototype.init = function () {
	this.initInternal();
	this.isInited = true;
};

AppBase.prototype.initInternal = function () {
	this.prepareUnits();
};

AppBase.prototype.ensureInited = function () {
	if (!this.isInited) {
		this.init();
	}
};

AppBase.prototype.prepareUnits = function () {
	this.units = this.createUnits();
	this.addUnits();
	this.initUnits();
};

AppBase.prototype.createUnits = function () {
	return new UnitSet();
};

AppBase.prototype.addUnit = function (name) {
	this.units.add(name, this.loadUnit(name));
};

AppBase.prototype.loadUnit = function (name) {
	var result;
	if (name == 'core.app') {
		result = this;
	}
	else {
		var Unit = this.loadUnitClass(name);
		result = new Unit();
	}
	return result;
};

AppBase.prototype.loadUnitClass = function (name) {
	return this.options.loader.loadUnitClass(name);
};

AppBase.prototype.addUnits = function () {
};

AppBase.prototype.initUnits = function () {
	this.units.init();
};

AppBase.prototype.start = function () {
	this.ensureInited();
};


module.exports = AppBase;

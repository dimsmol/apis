"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;
var UnitSet = require('units').UnitSet;


var AppBase = function (opt_options) {
	this.options = opt_options || {};
	this.loader = this.options.loader;

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
	return new UnitSet(this); // using app as as a loader
};

AppBase.prototype.addUnit = function (name) {
	var unit = this.loadUnit(name);
	if (unit == null) {
		throw new Error('Could not load unit ' + name);
	}
	this.units.add(name, unit);
};

AppBase.prototype.loadUnit = function (name, opt_local, opt_init) {
	var result;
	if (name == 'core.app') {
		result = this;
	}
	else if (this.loader != null) {
		result = this.loader.loadUnit(name, opt_local, opt_init);
	}
	return result;
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

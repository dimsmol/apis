"use strict";
var errors = require('./errors');


var Units = function () {
	this.units = {};
	this.skipInit = {};
};

Units.prototype.expose = function (key, prop) {
	this.add(key, prop, true);
};

Units.prototype.add = function (key, unit, skipInit) {
	if (key in this.units)
	{
		throw new errors.DuplicateUnit(key);
	}

	this.units[key] = unit;

	if (skipInit)
	{
		this.skipInit[key] = true;
	}
};

Units.prototype.get = function (key) {
	return this.units[key];
};

Units.prototype.require = function (key) {
	var unit = this.get(key);
	if (unit == null)
	{
		throw new errors.UnitRequired(key);
	}
	return unit;
};

Units.prototype.init = function () {
	for (var key in this.units)
	{
		if (!(key in this.skipInit))
		{
			this.units[key].unitInit(this);
		}
	}
};


module.exports = Units;

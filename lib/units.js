var inherits = require('util').inherits;

var abstractMethod = require('./tools/abstract_method').abstractMethod;


var DuplicateUnitError = function (key) {
	this.key = key;
};
inherits(DuplicateUnitError, Error);


var UnitRequiredError = function (key) {
	this.key = key;
};
inherits(UnitRequiredError, Error);


var Units = function () {
	this.units = {};
	this.needInit = {};
};

Units.prototype.addReady = function (key, unit) {
	this.add(key, unit, true);
};

Units.prototype.add = function (key, unit, skipInit) {
	if (key in this.units)
	{
		throw new DuplicateUnitError(key);
	}

	this.units[key] = unit;

	if (!skipInit)
	{
		this.needInit[key] = true;
	}
};

Units.prototype.get = function (key) {
	return this.units[key];
};

Units.prototype.require = function (key) {
	var unit = this.get(key);
	if (unit == null)
	{
		throw new UnitRequiredError(key);
	}
	return unit;
};

Units.prototype.init = function () {
	for (var key in this.needInit)
	{
		if (this.needInit[key])
		{
			this.units[key].init();
		}
	}
};


var Unit = function (units) {
	this.units = units;
};

Unit.prototype.init = abstractMethod;

Unit.prototype.require = function (key) {
	return this.units.require(key);
};


module.exports = {
	DuplicateUnitError: DuplicateUnitError,
	UnitRequiredError: UnitRequiredError,
	Units: Units,
	Unit: Unit
};

var inherits = require('util').inherits;

var InternalError = require('./errors').InternalError;
var abstractMethod = require('./tools').abstractMethod;


var DuplicateUnit = function (key) {
	this.key = key;
	this.message = this.getMessage();
};
inherits(DuplicateUnit, InternalError);

DuplicateUnit.prototype.name = 'DuplicateUnit';

DuplicateUnit.prototype.getMessage = function () {
	return ['Duplicate unit "', this.key, '"'].join('');
};


var UnitRequired = function (key) {
	this.key = key;
	this.message = this.getMessage();
};
inherits(UnitRequired, InternalError);

UnitRequired.prototype.name = 'UnitRequired';

UnitRequired.prototype.getMessage = function () {
	return ['Unit "', this.key, '" is required'].join('');
};


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
		throw new DuplicateUnit(key);
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
		throw new UnitRequired(key);
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

Unit.prototype.init = function () {
};

Unit.prototype.require = function (key) {
	return this.units.require(key);
};


module.exports = {
	DuplicateUnit: DuplicateUnit,
	UnitRequired: UnitRequired,
	Units: Units,
	Unit: Unit
};

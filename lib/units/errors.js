"use strict";
var inherits = require('util').inherits;
var ErrorBase = require('nerr').ErrorBase;


var DuplicateUnit = function (key) {
	ErrorBase.call(this);
	this.key = key;
};
inherits(DuplicateUnit, ErrorBase);

DuplicateUnit.prototype.name = 'DuplicateUnit';

DuplicateUnit.prototype.getMessage = function () {
	return ['Duplicate unit "', this.key, '"'].join('');
};


var UnitRequired = function (key) {
	ErrorBase.call(this);
	this.key = key;
};
inherits(UnitRequired, ErrorBase);

UnitRequired.prototype.name = 'UnitRequired';

UnitRequired.prototype.getMessage = function () {
	return ['Unit "', this.key, '" is required'].join('');
};


module.exports = {
	DuplicateUnit: DuplicateUnit,
	UnitRequired: UnitRequired
};

var inherits = require('util').inherits;
var InternalError = require('../errors').InternalError;


var DuplicateUnit = function (key) {
	InternalError.call(this);

	this.key = key;
	this.message = this.getMessage();
};
inherits(DuplicateUnit, InternalError);

DuplicateUnit.prototype.name = 'DuplicateUnit';

DuplicateUnit.prototype.getMessage = function () {
	return ['Duplicate unit "', this.key, '"'].join('');
};


var UnitRequired = function (key) {
	InternalError.call(this);

	this.key = key;
	this.message = this.getMessage();
};
inherits(UnitRequired, InternalError);

UnitRequired.prototype.name = 'UnitRequired';

UnitRequired.prototype.getMessage = function () {
	return ['Unit "', this.key, '" is required'].join('');
};


module.exports = {
	DuplicateUnit: DuplicateUnit,
	UnitRequired: UnitRequired
};

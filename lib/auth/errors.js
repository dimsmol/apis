"use strict";
var inherits = require('util').inherits;
var errors = require('../errors');


var UnexpectedIdentity = function () {
	errors.Conflict.call(this);
};
inherits(UnexpectedIdentity, errors.Conflict);

UnexpectedIdentity.prototype.name = 'UnexpectedIdentity';

UnexpectedIdentity.prototype.getMessage = function () {
	return this.status + ' Unexpected Identity';
};


module.exports = {
	UnexpectedIdentity: UnexpectedIdentity
};

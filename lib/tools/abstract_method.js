var inherits = require('util').inherits;
var InternalError = require('../errors').InternalError;


var AbstractMethodCall = function () {
};
inherits(AbstractMethodCall, InternalError);

AbstractMethodCall.prototype.name = 'AbstractMethodCall';

AbstractMethodCall.prototype.getMessage = function () {
	return 'Abstract method call';
};


var abstractMethod = function () {
	throw new AbstractMethodCall();
};


module.exports = {
	AbstractMethodCall: AbstractMethodCall,
	abstractMethod: abstractMethod
};

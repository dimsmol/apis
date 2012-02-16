var inherits = require('util').inherits;


var AbstractMethodCallError = function () {
};
inherits(AbstractMethodCallError, Error);


var abstractMethod = function () {
	throw new AbstractMethodCallError();
};


module.exports = {
	AbstractMethodCallError: AbstractMethodCallError,
	abstractMethod: abstractMethod
};

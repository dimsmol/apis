define(['./inherits'],
function (inherits) {
"use strict";

var StackKeeper = function () {
};

StackKeeper.prototype.toString = function () {
	return '';
};


var ErrorBase = function () {
	Error.call(this);
	this.stackKeeper = this.createStackKeeper();
};
inherits(ErrorBase, Error);

ErrorBase.prototype.name = 'ErrorBase';

ErrorBase.prototype.createStackKeeper = function () {
	var result = new StackKeeper();
	Error.captureStackTrace(result, this.constructor);
	return result;
};

ErrorBase.prototype.toString = function () {
	var result = this.name;
	var message = this.getMessage();
	if (message)
	{
		result = [result, message].join(': ');
	}
	return result;
};

ErrorBase.prototype.getMessage = function () {
	return 'Generic error';
};

ErrorBase.prototype.getStackTrace = function () {
	return this.toString() + this.stackKeeper.stack;
};

if (Object.defineProperties != null) {
	Object.defineProperties(ErrorBase.prototype, {
		stack: {
			get: function () {
				return this.getStackTrace();
			}
		},
		message: {
			get: function () {
				return this.getMessage();
			}
		}
	});
}

ErrorBase.StackKeeper = ErrorBase;


return ErrorBase;

});

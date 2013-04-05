"use strict";
var custom = require('../custom').custom;
var chain = require('../chain').chain;


var toHandler = function (handler) {
	var result = null;
	if (handler != null) {
		if (Array.isArray(handler)) {
			result = chain(handler);
		}
		else if (handler.constructor === Function) {
			result = custom(handler);
		}
		else {
			result = handler;
		}

		if (result.createHandler != null) {
			result = result.createHandler();
		}
	}
	return result;
};


module.exports = toHandler;

"use strict";
var inherits = require('util').inherits;
var RequestBase = require('../core/request');

var Request = function (connection, msg) {
	RequestBase.call(this, msg.headers, msg.body);

	this.connection = connection;
};
inherits(Request, RequestBase);


module.exports = Request;

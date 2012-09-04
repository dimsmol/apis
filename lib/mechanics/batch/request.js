"use strict";
var inherits = require('util').inherits;
var RequestBase = require('../core/request');

var Request = function (request) {
	RequestBase.call(this, request.headers);

	this.data = request.data;
	this.name = request.name;
};
inherits(Request, RequestBase);

Request.prototype.hasData = true;


module.exports = Request;

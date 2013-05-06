"use strict";
var inherits = require('inh');
var ErrorBase = require('nerr/lib/error_base');


var WebError = function (response) {
	this.response = response;

	this.status = response.status;
	var data = response.data || {};
	this._message = data.message;
	this.status = response.status;
	this.code = data.code;
};
inherits(WebError, ErrorBase);

WebError.prototype.name = 'WebError';

WebError.prototype.getMessage = function () {
	return this._message;
};

WebError.extract = function (result) {
	var status = result.status;
	var err = null;
	if (status != 200 && status != 204) {
		err = new WebError(result);
	}
	return err;
};


module.exports = WebError;

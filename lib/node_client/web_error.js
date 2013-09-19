"use strict";
var inherits = require('inherits');
var mt = require('marked_types');
var ErrorBase = require('nerr/lib/error_base');


var WebError = function (result) {
	ErrorBase.call(this);

	this.result = result;

	this.status = result.status;
	var data = result.data || {};
	this._message = data.message;
	this.status = result.status;
	this.code = data.code;
};
inherits(WebError, ErrorBase);
mt.mark(WebError, 'apis:(client):WebError');

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

"use strict";
var inherits = require('util').inherits;
var handlers = require('./handlers');
var res = require('./resources').res;
var testPage = require('./test_page');

var st = handlers.st;
var impls = handlers.impls;
var ret = handlers.ret;
var cont = handlers.cont;


// Contract example
var Contract = function () {
	handlers.Contract.call(this);
	this.isMain = true;
};
inherits(Contract, handlers.Contract);

Contract.prototype.unitInit = function (units) {
	this.addItems([
		cont('/test', [testPage.contract]),
		res.get('/', [
			ret.str,
				impls(function (ctx) {
					return 'Hello, apis! :)';
				})
		])
	]);
};


module.exports = Contract;

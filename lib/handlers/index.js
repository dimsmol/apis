"use strict";
var core = require('./core');
var Auth = require('./auth');
var Chain = require('./chain');
var Contract = require('./contract');
var Data = require('./data');
var Impl = require('./impl');
var Result = require('./result');
var Ret = require('./ret');
var Static = require('./static');


module.exports = {
	core: core,
	Auth: Auth,
	auth: Auth.auth,
	Chain: Chain,
	chain: Chain.chain,
	Contract: Contract,
	cont: Contract.cont,
	main: Contract.main,
	contract: Contract.contract,
	Data: Data,
	data: Data.data,
	Impl: Impl,
	impl: Impl.impl,
	impls: Impl.impls,
	Result: Result,
	result: Result.result,
	Ret: Ret,
	ret: Ret.ret,
	Static: Static,
	st: Static.st
};

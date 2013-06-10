"use strict";
var ServiceAuthProvider = require('./service');
var AppAuthProvider = require('./app');


module.exports = {
	Service: ServiceAuthProvider,
	App: AppAuthProvider
};

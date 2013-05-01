"use strict";
var authen = require('authen');
var Auth = require('../handlers/auth');
var CtxAdapter = require('./ctx_adapter');


var AuthUnit = function () {
	this.settings = null;

	this.adapter = null;
	this.providers = {};
	this.providersByKey = {};
	this.factory = this.createFactory();

	this.revokerFactoryFunc = null;
};

AuthUnit.prototype.unitInit = function (units) {
	this.settings = units.require('core.settings');
	this.init();
};

AuthUnit.prototype.setRevokerFactoryFunc = function (f) {
	this.revokerFactoryFunc = f;
};

AuthUnit.prototype.init = function () {
	this.initMainAdapter(this.getAdapterSettings());
	this.initProviders(this.getProvidersSettings());
};

AuthUnit.prototype.getAdapterSettings = function () {
	return this.settings.core.auth.adapter;
};

AuthUnit.prototype.getProvidersSettings = function () {
	return this.settings.core.auth.providers;
};

AuthUnit.prototype.getHandlerSettings = function () {
	return this.settings.core.auth.handler;
};

AuthUnit.prototype.initMainAdapter = function (settings) {
	this.adapter = this.createMainAdapter(settings);
};

AuthUnit.prototype.initProviders = function (providersSettings) {
	for (var type in providersSettings) {
		this.initProvider(type, providersSettings[type]);
	}
};

AuthUnit.prototype.initProvider = function (type, settings) {
	settings = settings || {};
	var provider = this.createProvider(type, settings.provider);
	var tokener = this.createTokener(type, settings.tokener, settings.signer);
	var adapter = this.obtainAdapter(type, settings.adapter);
	var revoker = this.createRevoker(type, settings.revoker);
	provider.type = type;
	provider.setTokener(tokener);
	provider.setAdapter(adapter);
	provider.setRevoker(revoker);
	this.addProvider(provider);
};

AuthUnit.prototype.addProvider = function (provider) {
	this.providers[provider.type] = provider;
	this.providersByKey[provider.options.key] = provider;
};

AuthUnit.prototype.createProvider = function (type, settings) {
	return new authen.AuthProvider(settings);
};

AuthUnit.prototype.createTokener = function (type, tokenerSettings, signerSettings) {
	var signer = this.createSigner(signerSettings);
	return new authen.Tokener(signer, tokenerSettings);
};

AuthUnit.prototype.obtainAdapter = function (type, settings) {
	var result;
	if (settings == 'main') {
		result = this.adapter;
	}
	else {
		result = this.createAdapter(type, settings);
	}
	return result;
};

AuthUnit.prototype.createMainAdapter = function (settings) {
	return this.createAdapter(settings);
};

AuthUnit.prototype.createAdapter = function (type, settings) {
	settings = settings || {};
	var httpAdapter = this.createHttpAdapter(type, settings.http);
	return new CtxAdapter(httpAdapter, settings.ctx);
};

AuthUnit.prototype.createHttpAdapter = function (type, settings) {
	return new authen.HttpAdapter(settings);
};

AuthUnit.prototype.createRevoker = function (type, settings) {
	var result = null;
	if (this.revokerFactoryFunc != null) {
		result = this.revokerFactoryFunc(type, settings);
	}
	return result;
};

AuthUnit.prototype.createHandler = function (settings) {
	return new Auth(settings);
};

AuthUnit.prototype.initHandler = function (authorizationFunc) {
	var auth = this.createHandler(this.getHandlerSettings());
	auth.setAdapter(this.adapter);
	auth.setProviders(this.providersByKey);
	auth.setAuthorizationFunc(authorizationFunc);
	return auth;
};

Object.defineProperties(AuthUnit.prototype, {
	handler: {
		get: function () {
			var self = this;
			return function (authorizationFunc) {
				return self.initHandler(authorizationFunc);
			};
		}
	}
});


module.exports = AuthUnit;

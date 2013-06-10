"use strict";
var authen = require('authen');
var Auth = require('../handlers/auth');
var CtxAdapter = require('./ctx_adapter');
var ServiceAuthProvider = require('./providers/service');
var AppAuthProvider = require('./providers/app');


var AuthUnit = function () {
	this.units = null;
	this.settings = null;
	this.providerClasses = this.getProviderClasses();

	this.adapter = null;
	this.providers = {};
	this.providersByKey = {};

	this.revokerFactory = null;

	this.handler = this.createHandlerFactory();
};

AuthUnit.prototype.unitIsInitRequired = true;

AuthUnit.prototype.unitInit = function (units) {
	this.units = units; // can be useful for other init
	this.settings = units.require('core.settings');
	this.init();
};

AuthUnit.prototype.getProviderClasses = function () {
	return {
		user: authen.AuthProvider,
		service: ServiceAuthProvider,
		app: AppAuthProvider
	};
};

AuthUnit.prototype.setRevokerFactory = function (f) {
	this.revokerFactory = f;
};

AuthUnit.prototype.init = function () {
	this.initMainAdapter(this.getAdapterSettings());
	this.initProviders(this.getProvidersSettings());
};

AuthUnit.prototype.getAuthSettings = function () {
	return this.settings.core.auth;
};

AuthUnit.prototype.getAdapterSettings = function () {
	return this.getAuthSettings().adapter;
};

AuthUnit.prototype.getProvidersSettings = function () {
	return this.getAuthSettings().providers;
};

AuthUnit.prototype.getHandlerSettings = function () {
	return this.getAuthSettings().handler;
};

AuthUnit.prototype.getAlgoMaps = function (type) {
	var result = this.getAuthSettings().algoMaps;
	var s = this.getProvidersSettings()[type];
	if (s != null) {
		s = s.tokener;
		if (s != null) {
			result = s.algoMaps;
		}
	}
	return result;
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

	var tokener = this.initTokener(type, settings);
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
	this.providersByKey[provider.options.key || ''] = provider;
};

AuthUnit.prototype.createProvider = function (type, settings) {
	var ProviderClass = this.providerClasses[type];
	if (ProviderClass == null) {
		ProviderClass = authen.AuthProvider;
	}
	return new ProviderClass(settings);
};

AuthUnit.prototype.initTokener = function (type, settings) {
	var tokener = this.createTokener(type, settings.tokener);
	var signer = this.createSigner(type, settings.signer);
	var crypter = this.createCrypter(type, settings.crypter);
	tokener.setSigner(signer);
	tokener.setCrypter(crypter);
	tokener.setAlgoMaps(this.getAlgoMaps(type));
	return tokener;
};

AuthUnit.prototype.createTokener = function (type, settings) {
	return new authen.AuthTokener(settings);
};

AuthUnit.prototype.createSigner = function (type, settings) {
	var result = null;
	if (settings != null) {
		result = new authen.Signer(settings);
	}
	return result;
};

AuthUnit.prototype.createCrypter = function (type, settings) {
	var result = null;
	if (settings != null) {
		result = new authen.Crypter(settings);
	}
	return result;
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
	if (this.revokerFactory != null) {
		result = this.revokerFactory(type, settings);
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

AuthUnit.prototype.createHandlerFactory = function () {
	var self = this;
	var result = function (authorizationFunc) {
		return self.initHandler(authorizationFunc);
	};
	return result;
};


module.exports = AuthUnit;

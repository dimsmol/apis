"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;


var Settings = function (rootPath) {
	this.rootPath = rootPath;
	this.core = null;
};
inherits(Settings, Unit);

Settings.prototype.getPrepared = function () {
	this.prepare();
	return this;
};

Settings.prototype.prepare = function () {
	this.init();
	this.applyLocal();
};

Settings.prototype.init = function () {
	var authTimeout = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks in ms

	// example of all settings understood by apis
	this.core = {
		debug: false,

		logging: {
			loggers: {
				sockjs: {
					logLevel: null // 'error'
				},
				ctx: {
					logLevel: null // 'error'
				}
			}
		},

		prefix: null, // example: '/someprefix'

		web: {
			listen: {
				port: 3000,
				address: 'localhost'
			},

			static: {
				prefix: '/static',
				paths: {
					main: this.rootPath + '/public/static',
					dev: this.rootPath + '/public_dev/static'
				}
			},

			jsonp: {
				disable: false
			},

			cors: {
				disable: false,
				allowCredentials: true,
				maxAge: 2 * 24 * 60 * 60 // 2 days in s
			}
		},

		handlers: {
			data: {
				needValidatorInfo: false,
				logWithData: false
			},

			result: {
				provideStackTrace: false, // true, false, 'debug'
				validateResult: 'debug', // true, false, 'debug'
				logWithData: false
			}
		},

		socket: {
			disable: false,
			prefix: '/socket'
		},

		auth: {
			timeout: authTimeout,
			postRevokationTrustDelay: 5 * 60 * 1000, // 5 minites in ms
			headers: {
				name: 'X-Auth',
				nameExpected: 'X-AuthExpected'
			},
			cookies: {
				name: 'auth',
				nameLimited: 'authTwin',
				useLimited: true,
				forceNonHttp: false, // don't force exposing cookie data to JS
				secure: false,
				domain: null,
				path: '/'
			},
			renewal: {
				interval: Math.round(authTimeout / 2),
				headers: {
					name: 'X-AuthRenewal',
					nameIssued: 'X-AuthRenewalIssued',
					nameMaxAge: 'X-AuthRenewalMaxAge'
				}
			}
		},

		stat: {
			// for mechanics/socket/stat
			socket: {
				frameSize: null, // 10000
				per: null, // 1000
				old: null // 2 * 60 * 1000
			}
		}
	};
};

Settings.prototype.getSettingsLocal = function () {
	return null;
};

Settings.prototype.applyLocal = function () {
	var settingsLocal = this.getSettingsLocal();
	if (settingsLocal)
	{
		settingsLocal.update(this);
	}
};

Settings.getSettings = function (rootPath) {
	return new Settings(rootPath).getPrepared();
};


module.exports = Settings;

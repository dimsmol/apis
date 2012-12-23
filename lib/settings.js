"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;


var Settings = function () {
	this._areSettingsPrepared = false;
	this.core = null;
};
inherits(Settings, Unit);

Settings.prototype.unitIsInitRequired = true;

Settings.prototype.unitGetInstance = function () {
	this.ensurePrepared();
	return this;
};

Settings.prototype.ensurePrepared = function () {
	if (!this._areSettingsPrepared) {
		this.prepare();
	}
	return this;
};

Settings.prototype.prepare = function () {
	this.init();
	this.applyLocal();
	this._areSettingsPrepared = true;
};

Settings.prototype.init = function () {
	var authMaxAge = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks in ms

	// default values for all settings understood by apis
	this.core = {
		debug: false,

		daemon: {
			start: {
				exec: null,
				args: null,
				stdout: null,
				stderr: null
			},
			pidFile: 'var/run/app.pid',
			exitCheckInterval: 200
		},

		cluster: {
			disabled: false,
			numberOfWorkers: null, // cpus().length
			master: {
				exec: require.main.filename,
				args: null,
				silent: null
			},
			checks : {
				lazy: {
					interval: 40 * 1000,
					maxTime: 30 * 1000
				},
				zombie: {
					interval: 40 * 1000,
					maxTime: 30 * 1000
				}
			}
		},

		logging: {
			loggers: {
				sockjs: {
					logLevel: null // 'error'
				},
				ctx: {
					logLevel: null // 'error'
				},
				cluster: {
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

			headers: {
				nameMethod: 'X-Method'
			},

			bodyMaxSize: null, // bytes, null for no limit

			crossDomainWorkaround: {
				key: 'xdomain',
				disabled: false,
				jsonp: {
					disabled: false,
					callbackKey: 'callback'
				},
				frame: {
					disabled: false
				}
			},

			cors: {
				disabled: false,
				allowCredentials: true,
				maxAge: 2 * 24 * 60 * 60, // 2 days in s

				// list of allowed origins, null to allow any
				// must contain string and/or RegExp objects
				// usefull to prevent browser-based distributed attacks
				//
				// NOTE origins are converted to lowercase before check,
				// for RegExp objects don't forget starting ^ and trailing $,
				// as well as escaping for '.', example:
				// /^http:\/\/example\.com$/
				restrictToOrigins: null
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
			disabled: false,
			prefix: '/socket'
		},

		auth: {
			maxAge: authMaxAge,
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
				interval: Math.round(authMaxAge / 2),
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
	if (settingsLocal) {
		settingsLocal.update(this);
	}
};


module.exports = Settings;

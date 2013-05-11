"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;


var Settings = function () {
	this.core = null;
};
inherits(Settings, Unit);

Settings.prototype.unitIsInitRequired = true;

Settings.prototype.unitInit = function (units) {
	this.prepare();
};

Settings.prototype.prepare = function () {
	this.init();
	this.applyLocal();
};

Settings.prototype.init = function () {
	var authMaxAge = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks in ms

	// default values for all settings understood by apis
	this.core = {
		debug: false,

		domain: {
			disabled: false
		},

		uncaught: {
			disabled: false
		},

		daemon: {
			start: {
				exec: require.main.filename,
				args: ['daemon'],
				stdout: 'var/log/app.log',
				stderr: 'var/log/app.log'
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
			rootLogger: 'root',

			loggers: {
				root: {
					logLevel: 'error',
					engine: {
						unit: 'core.logging.engines.stream',
						settings: {}
					},
					sendTo: []
				},
				console: { // useful for testing, etc.
					logLevel: 'error',
					engine: {
						unit: 'core.logging.engines.stream',
						settings: {}
					},
					sendTo: []
				},
				uncaught: {
				},
				cluster: {
				},
				ctx: {
				},
				sockjs: {
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
				key: 'crossDomain',
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
			handler: { // see ./handlers/auth options
				defaultOnBehalfAuthType: 'user'
			},
			//adapter: {
			//	ctx: {} // see CtxAdapter options
			//	http: {} // see authen.HttpAdapter options
			//},
			providers: {
				user: {
					//provider: {}, // see authen.AuthProvider options
					//tokener: {}, // see authen.Tokener options
					//signer: {}, // see authen.Signer options, required if no signing crypter is used
					//crypter: {}, // see authen.Crypter options
					//revoker: {}, // settings for revoker
					adapter: 'main'
				},
				service: {
					provider: {
						//reuseMainAuthData: false, // allows to reuse authData extracted by main adapter even if has own
						key: 's', // what key extracted from token will specify this provider
						allowOnBehalf: true, // use "on behalf of" if provided
						useLimitedToken: false
					},
					tokener: {
						prefix: 's'
					},
					//signer: {}, // see authen.Signer options, required if no signing crypter is used
					//crypter: {}, // see authen.Crypter options
					//revoker: {}, // settings for revoker
					adapter: 'main'
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

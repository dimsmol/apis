"use strict";
var inherits = require('util').inherits;
var SettingsBase = require('./settings_base');


var Settings = function () {
	SettingsBase.call(this);
	this.core = null;
};
inherits(Settings, SettingsBase);

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
			listen: { // use Array to create multiple servers
				port: 3000,
				address: 'localhost'
				//https: {} // optional https options, must be null for http
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
			//handler: {}, // see ./handlers/auth options
			//adapter: {
			//	ctx: {} // see CtxAdapter options
			//	http: {} // see authen.HttpAdapter options
			//},
			//algoMaps: { // see authen.Tokener setAlgoMaps()
			//	signer: {
			//		sha1: 'a'
			//	},
			//	crypter: {
			//		aes256: 'a'
			//	}
			//},
			providers: {
				user: {
					//provider: {}, // see authen.AuthProvider options
					//tokener: {}, // see authen.AuthTokener options
					//signer: {}, // see authen.Signer options, required if no signing crypter is used
					//crypter: {}, // see authen.Crypter options
					//revoker: {}, // settings for revoker
					//algoMaps: {}, // main algoMaps can be overriden
					adapter: 'main'
				},
				service: {
					provider: {
						//reuseMainAuthData: false, // allows to reuse authData extracted by main adapter even if has own
						key: 's', // what key extracted from token will specify this provider
						allowOnBehalf: true, // use "on behalf of" if provided
						defaultOnBehalfAuthType: 'user',
						useLimitedToken: false
					},
					tokener: {
						prefix: 's'
					},
					//signer: {}, // see authen.Signer options, required if no signing crypter is used
					//crypter: {}, // see authen.Crypter options
					//revoker: {}, // settings for revoker
					//algoMaps: {}, // main algoMaps can be overriden
					adapter: 'main'
				},
				app: {
					provider: {
						key: 'a',
						maxAge: 3 * 60 * 60 * 1000, // 3 hours
						useLimitedToken: false,
						renewalInterval: 2 * 60 * 60 * 1000, // 2 hours
						defaultAuthType: 'user'
					},
					tokener: {
						prefix: 'a'
					},
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


module.exports = Settings;

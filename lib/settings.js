"use strict";
var inherits = require('util').inherits;
var Unit = require('./units/unit');


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

		listen: {
			port: 3000,
			address: 'localhost'
		},

		web: {
			static: {
				prefix: '/static',
				paths: {
					main: this.rootPath + '/public/static',
					dev: this.rootPath + '/public_dev/static'
				}
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

		// for stat/socket_stat
		stat: {
			socket: {
				frameSize: null, // 10000
				per: null, // 1000
				old: null // 2 * 60 * 1000
			}
		}
	};
};

Settings.prototype.getSocketPrefix = function () {
	var prefix = this.core.prefix;
	var socketPrefix = this.core.socket.prefix;
	return prefix ? prefix + socketPrefix : socketPrefix;
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

module.exports = Settings;

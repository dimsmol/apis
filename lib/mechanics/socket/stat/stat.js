"use strict";
var inherits = require('util').inherits;
var Unit = require('units').Unit;

var Freq = require('./freq');


var SocketStat = function () {
	this.freq = null;
	this.per = null;
	this.old = null;
};
inherits(SocketStat, Unit);

SocketStat.prototype.unitInit = function (units) {
	var coreSettings = units.require('core.settings').core;
	var mechanics = units.require('core.mechanics.socket');

	var frameSize = null;
	if (coreSettings.stat && coreSettings.stat.socket)
	{
		var statSettings = coreSettings.stat.socket;
		if (statSettings.frameSize != null)
		{
			frameSize = statSettings.frameSize;
		}
		this.per = statSettings.per;
		this.old = statSettings.old || 2 * 60 * 1000;
	}
	this.freq = new Freq(frameSize);

	if (mechanics != null)
	{
		this.freq.start();

		var self = this;
		mechanics.on('connect', function (connection) {
			self.freq.update('connect');
		});
		mechanics.on('disconnect', function (connection) {
			self.freq.update('disconnect');
		});
		mechanics.on('message', function (connection, message) {
			self.freq.update('messageIn');
		});
		mechanics.transport.on('message_sent', function (connection, message) {
			self.freq.update('messageOut');
		});
	}
};

SocketStat.prototype.getStat = function () {
	var result = {};
	this.updateResult(result, 'socket', this.getSocketStat());
	return result;
};

SocketStat.prototype.updateResult = function (result, key, value) {
	if (value != null) {
		result[key] = value;
	}
};

SocketStat.prototype.getSocketStat = function () {
	return {
		frameSize: this.freq.frameSize,
		per: this.per == null ? 1000 : this.per,
		old: this.old,
		freq: {
			connect: this.freq.getFreqNorm('connect'),
			disconnect: this.freq.getFreqNorm('disconnect'),
			messageIn: this.freq.getFreqNorm('messageIn'),
			messageOut: this.freq.getFreqNorm('messageOut')
		}
	};
};


module.exports = SocketStat;

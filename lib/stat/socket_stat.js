var inherits = require('util').inherits;
var Unit = require('../units').Unit;

var Freq = require('./freq');


var SocketStat = function () {
	this.freq = null;
	this.per = null;
	this.connections = null;
};
inherits(SocketStat, Unit);

SocketStat.prototype.unitInit = function (units) {
	this.connections = units.get('core.connections');
	var coreSettings = units.require('core.settings').core;
	var mechanics = units.require('core.lowlevel').socket;

	var frameSize = null;
	if (coreSettings.stat && coreSettings.stat.socket)
	{
		var statSettings = coreSettings.stat.socket;
		if (statSettings.frameSize != null)
		{
			frameSize = statSettings.frameSize;
		}
		this.per = statSettings.per;
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

	this.updateResult(result, 'connections', this.getConnectionsStat());
	this.updateResult(result, 'socket', this.getSocketStat());

	return result;
};

SocketStat.prototype.updateResult = function (result, key, value) {
	if (value != null)
	{
		result[key] = value;
	}
};

SocketStat.prototype.getConnectionsStat = function () {
	var result = null;

	var connections = this.connections;
	if (connections != null)
	{
		result = {
			counts: {
				connection: connections.connectionCount,
				user: connections.userConnections.count,
				endpoint: connections.endpointConnections.count
			}
		};

		var byTransport = {};
		for (var k in connections.connections)
		{
			var connection = connections.connections[k];
			// TODO replace code below with connection.protocol when sockjs will be updated
			var recv = connection._session.recv;

			var protocol = null;
			if (recv != null)
			{
				protocol = recv.protocol;
			}
			protocol = protocol || 'unknown';

			var count = byTransport[protocol];
			byTransport[protocol] = (count == null ? 1 : count + 1);
		}
		result.counts.byTransport = byTransport;
	}

	return result;
};

SocketStat.prototype.getSocketStat = function () {
	return {
		frameSize: this.freq.frameSize,
		per: this.per == null ? 1000 : this.per,
		freq: {
			connect: this.freq.getFreqNorm('connect'),
			disconnect: this.freq.getFreqNorm('disconnect'),
			messageIn: this.freq.getFreqNorm('messageIn'),
			messageOut: this.freq.getFreqNorm('messageOut')
		}
	};
};


module.exports = SocketStat;

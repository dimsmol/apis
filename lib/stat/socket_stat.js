"use strict";
var inherits = require('util').inherits;
var Unit = require('../units').Unit;

var Freq = require('./freq');


var SocketStat = function () {
	this.freq = null;
	this.per = null;
	this.old = null;
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
		this.old = statSettings.old || 5 * 60 * 1000;
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

		var noEndpointCount = 0;
		var noEndpointOldCount = 0;
		var now = Date.now();
		var count = 0;
		var totalLifetime = 0;
		var oldest = null;
		var byTransport = {};
		for (var k in connections.connections)
		{
			count++;
			var connection = connections.connections[k];
			var connectionStartTime = connection.userData.startTime;
			var connectionTime = now - connectionStartTime;

			totalLifetime += connectionTime;
			if (oldest == null || oldest < connectionStartTime) {
				oldest = connectionStartTime;
			}

			var endpointInfo = connections.getEndpoint(connection);
			if (endpointInfo == null || endpointInfo.endpointId == null)
			{
				noEndpointCount++;
				if (connectionTime >= this.old) {
					noEndpointOldCount++;
				}
			}

			var protocol = this.getProtocol(connection);
			var byTransportCount = byTransport[protocol];
			byTransport[protocol] = (byTransportCount == null ? 1 : byTransportCount + 1);
		}

		result.counts.connectionWithoutEndpoint = {
			total: noEndpointCount,
			old: noEndpointOldCount
		};
		result.counts.byTransport = byTransport;

		if (oldest != null) {
			result.lifetime = {
				oldest: {
					started: new Date(oldest),
					duration: now - oldest
				},
				medium: totalLifetime / count
			};
		}

		var endpointConnectionsStat = this.getEndpointConnectionsStat(connections.endpointConnections);
		if (endpointConnectionsStat != null)
		{
			result.counts.endpointWithManyConnections = endpointConnectionsStat;
		}
	}

	return result;
};

SocketStat.prototype.getEndpointConnectionsStat = function (endpointConnections) {
	var result = {
		count: 0
	};
	var transports = {};
	var found = false;
	for (var k in endpointConnections.dict)
	{
		var singleEndpointConnections = endpointConnections.get(k);
		var count = 0;
		var byTransport = {};
		for (var j in singleEndpointConnections)
		{
			count++;
			var connection = singleEndpointConnections[j];
			var protocol = this.getProtocol(connection);
			var byTransportCount = byTransport[protocol];
			byTransport[protocol] = (byTransportCount == null ? 1 : byTransportCount + 1);
		}
		if (count > 1)
		{
			found = true;
			result.count++;
			var hash = this.getTransportsHash(byTransport);
			var byHash = transports[hash];
			if (byHash == null)
			{
				transports[hash] = {
					transports: byTransport,
					count: 1
				};
			}
			else
			{
				byHash.count++;
			}
		}
	}
	if (found)
	{
		var combinations = [];
		for (var i in transports)
		{
			combinations.push(transports[i]);
		}
		result.combinations = combinations;
	}
	else
	{
		result = null;
	}
	return result;
};

SocketStat.prototype.getTransportsHash = function (transportCounts) {
	var arr = [];
	for (var transport in transportCounts)
	{
		arr.push([
			transport,
			transportCounts[transport]
		].join('\n'));
	}
	return arr.sort().join('\n\n');
};

SocketStat.prototype.getProtocol = function (connection) {
	// TODO replace code below with connection.protocol when sockjs will be updated
	var recv = connection._session.recv;
	var protocol = null;
	if (recv != null)
	{
		protocol = recv.protocol;
	}
	return protocol || 'unknown';
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

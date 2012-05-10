"use strict";
var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ConnectionsDict = require('./connections_dict');


// NOTE implements Unit
var Connections = function () {
	EventEmitter.call(this);

	this.connections = {};
	this.connectionCount = 0;

	this.userConnections = new ConnectionsDict();
	this.endpointConnections = new ConnectionsDict();
};
inherits(Connections, EventEmitter);

Connections.prototype.unitInit = function (units) {
	var mechanics = units.require('core.lowlevel').socket;
	if (mechanics != null)
	{
		var self = this;
		mechanics.on('connect', function (connection) {
			self.add(connection);
		});
		mechanics.on('disconnect', function (connection) {
			self.remove(connection);
		});
	}
};

Connections.prototype.isPresent = function (userId) {
	return userId in this.userConnections.dict;
};

Connections.prototype.getEndpoint = function (connection) {
	return connection.userData.endpointInfo;
};

Connections.prototype.registerEndpoint = function (connection, endpointInfo) {
	this.emit('endpoint_register', connection, endpointInfo);

	this.unregisterEndpoint(connection); // one endpoint per connection please

	connection.userData.endpointInfo = endpointInfo;

	if (endpointInfo.userId != null) {
		this.userConnections.add(endpointInfo.userId, connection);
	}

	var endpointKey = this.getEndpointKey(endpointInfo);
	this.endpointConnections.add(endpointKey, connection);
};

Connections.prototype.unregisterEndpoint = function (connection) {
	var endpointInfo = connection.userData.endpointInfo;

	if (endpointInfo != null)
	{
		if (endpointInfo.userId != null)
		{
			this.userConnections.remove(endpointInfo.userId, connection);
		}

		if (endpointInfo.endpointId != null)
		{
			var endpointKey = this.getEndpointKey(endpointInfo);
			this.endpointConnections.remove(endpointKey, connection);
		}

		this.emit('endpoint_unregistered', connection, endpointInfo);
	}
};

Connections.prototype.getEndpointKey = function (endpointInfo) {
	return [endpointInfo.userId, endpointInfo.endpointId].join('\n');
};

Connections.prototype.add = function (connection) {
	connection.userData = connection.userData || {};
	connection.userData.startTime = Date.now();
	var id = connection.id;
	if (!(id in this.connections))
	{
		this.connectionCount++;
	}
	this.connections[id] = connection;
};

Connections.prototype.remove = function (connection) {
	var id = connection.id;
	if (id in this.connections)
	{
		this.connectionCount--;
		delete this.connections[id];
	}

	this.unregisterEndpoint(connection);
};

Connections.prototype.getUserConnections = function (userId) {
	return this.userConnections.get(userId);
};

Connections.prototype.getEndpointConnections = function (endpointInfo) {
	var endpointKey = this.getEndpointKey(endpointInfo);
	return this.endpointConnections.get(endpointKey);
};


module.exports = Connections;

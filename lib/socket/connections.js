var inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

var ConnectionsDict = require('./connections_dict');


var Connections = function () {
	EventEmitter.call(this);

	this.connections = {};
	this.connectionCount = 0;

	this.userConnections = new ConnectionsDict();
	this.endpointConnections = new ConnectionsDict();
};
inherits(Connections, EventEmitter);

Connections.prototype.getStat = function (settings) {
	var k;

	var result = {
		counts: {
			connection: this.connectionCount,
			user: this.userConnections.count,
			endpoint: this.endpointConnections.count
		}
	};

	if (settings.recheckUsers)
	{
		var userCount = 0;
		for (k in this.userConnections.dict)
		{
			userCount++;
		}

		result.userCount = userCount;
	}

	if (settings.includeByTransport)
	{
		var byTransport = {};
		for (k in this.connections)
		{
			var connection = this.connections[k];
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

	this.userConnections.add(endpointInfo.userId, connection);

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

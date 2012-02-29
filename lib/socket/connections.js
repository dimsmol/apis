var ConnectionsDict = require('./connections_dict');


var Connections = function() {
	this.connections = {};

	this.userConnections = new ConnectionsDict();
	this.endpointConnections = new ConnectionsDict();
};

Connections.prototype.registerEndpoint = function(connection, endpointInfo) {
	this.unregisterEndpoint(connection); // one endpoint per connection please

	connection.userData.endpointInfo = endpointInfo;

	this.userConnections.add(endpointInfo.userId, connection);

	var endpointKey = this.getEndpointKey(endpointInfo.userId, endpointInfo.endpointId);
	this.endpointConnections.add(endpointKey, connection);
};

Connections.prototype.unregisterEndpoint = function(connection) {
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
	}
};

Connections.prototype.difference = function(connections, connectionsToNotInclude) {
	var result = {};
	for (var id in connections)
	{
		if (connectionsToNotInclude || !(id in connectionsToNotInclude))
		{
			result[id] = connections[id];
		}
	}

	return result;
};

Connections.prototype.getEndpointKey = function(endpointInfo) {
	return [endpointInfo.userId, endpointInfo.endpointId].join('\n');
};

Connections.prototype.add = function(connection) {
	var id = connection.id;
	this.connections[id] = connection;
};

Connections.prototype.remove = function(connection) {
	var id = connection.id;
	delete this.connections[id];

	this.unregisterEndpoint(connection);
};

Connections.prototype.getUserConnections = function(userId) {
	return this.userConnections.get(userId);
};

Connections.prototype.getEndpointConnections = function(endpointInfo) {
	var endpointKey = this.getEndpointKey(endpointInfo);
	return this.endpointConnections.get(endpointKey);
};


module.exports = Connections;

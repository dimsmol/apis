var ConnectionsDict = require('./connections_dict');


var Connections = function() {
	this.connections = {};

	this.userConnections = new ConnectionsDict();
	this.endPointConnections = new ConnectionsDict();
};

Connections.prototype.difference = function(connections, connectionsToNotInclude) {
	var result = {};
	for (var id in connections)
	{
		if (!(id in connectionsToNotInclude))
		{
			result[id] = connections[id];
		}
	}

	return result;
};

Connections.prototype.getEndPointKey = function(userId, endPointId) {
	return [userId, endPointId].join('\n');
};

Connections.prototype.add = function(connection) {
	var id = connection.id;
	this.connections[id] = connection;
};

Connections.prototype.remove = function(connection) {
	var id = connection.id;
	delete this.connections[id];

	var userId = connection.userData.userId;

	if (userId != null)
	{
		this.userConnections.remove(userId, connection);

		var endPointId = connection.userData.endPointId;
		if (endPointId != null)
		{
			var endPointKey = this.getEndPointKey(userId, endPointId);
			this.endPointConnections.remove(endPointKey, connection);
		}
	}
};

Connections.prototype.onIdentificationProvided = function(connection) {
	var userId = connection.userData.userId;
	var endPointId = connection.userData.endPointId;

	this.userConnections.add(userId, connection);

	var endPointKey = this.getEndPointKey(userId, endPointId);
	this.endPointConnections.add(endPointKey, connection);
};

Connections.prototype.getUserConnections = function(userId) {
	return this.userConnections.get(userId);
};

Connections.prototype.getEndPointConnections = function(userId, endPointId) {
	var endPointKey = this.getEndPointKey(userId, endPointId);
	return this.endPointConnections.get(endPointKey);
};


module.exports = Connections;

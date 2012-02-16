var inherits = require('util').inherits;

var DoubleDict = require('../tools').DoubleDict;


var ConnectionsDict = function() {
	ConnectionsDict.super_.call(this);
};
inherits(ConnectionsDict, DoubleDict);

ConnectionsDict.prototype.add = function(key, connection) {
	var subKey = connection.id;
	ConnectionsDict.super_.prototype.add.call(this, key, subKey, connection);
};

ConnectionsDict.prototype.remove = function(key, connection) {
	var subKey = connection.id;
	ConnectionsDict.super_.prototype.remove.call(this, key, subKey);
};


module.exports = ConnectionsDict;

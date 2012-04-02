var inherits = require('util').inherits;

var BadRequest = require('./core').BadRequest;


var MetadataRequired = function (dataName) {
	BadRequest.call(this);
	this.dataName = dataName;
};
inherits(MetadataRequired, BadRequest);

MetadataRequired.prototype.name = 'MetadataRequired';

MetadataRequired.prototype.getMessage = function () {
	return [
		this.dataName, ' required in metadata'].join('');
};

MetadataRequired.prototype.getDetails = function (isDebug) {
	var result = MetadataRequired.super_.prototype.getDetails.call(this);
	result.dataName = this.dataName;
	return result;
};

module.exports = {
	MetadataRequired: MetadataRequired
};

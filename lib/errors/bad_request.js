var inherits = require('util').inherits;

var BadRequest = require('./core').BadRequest;


var MetadataRequired = function (dataName) {
	this.dataName = dataName;
};
inherits(MetadataRequired, BadRequest);

MetadataRequired.prototype.getMessage = function () {
	return [
		this.status, ' Bad request: ',
		this.dataName, ' required in metadata'].join('');
};

MetadataRequired.prototype.getDetails = function (isDebug) {
	var result = InternalError.super_.prototype.getDetails.call(this);

	result._type = 'MetadataRequired';
	result.dataName = this.dataName;

	return result;
};

"use strict";
var Mechanics = require('./mechanics');
var Cors = require('./cors');
var crossDomainWorkaround = require('./cross_domain_workaround');


module.exports = {
	Mechanics: Mechanics,
	Cors: Cors,
	crossDomainWorkaround: crossDomainWorkaround
};

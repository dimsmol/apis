"use strict";
var inherits = require('util').inherits;
var AppBase = require('./app_base');


var App = function (opt_options) {
	AppBase.call(this, opt_options);
};
inherits(App, AppBase);

// this is an example, use only units you really need
App.prototype.addUnits = function () {
	//this.addUnit('core.app'); // some of your modules may require on it

	//this.addUnit('core.uncaught'); // optional, but highly recommended
	//this.addUnit('core.logging');

	//this.addUnit('core.mechanics.web');

	// sockets (optional)
	//this.addUnit('core.mechanics.socket');
	//this.addUnit('core.mechanics.socket.connections');
	//this.addUnit('core.mechanics.socket.stat');

	// custom
	//this.addUnit('core.settings');
	//this.addUnit('core.handler');

	// your own units
	//this.units.add('myunit', new MyUnitClass());
};

App.prototype.start = function () {
	this.ensureInited();
	this.units.require('core.mechanics.web').start();
};


module.exports = App;

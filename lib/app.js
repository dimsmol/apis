var abstractMethod = require('./tools').abstractMethod;

var Lowlevel = require('./lowlevel');
var Units = require('./units').Units;


var App = function () {
	this.config = null;
	this.lowlevel = null;
	this.units = null;
	this.contract = null;
};

App.prototype.defineConfig = abstractMethod;
App.prototype.applyContract = abstractMethod;

App.prototype.start = function () {
	this.lowlevel.start();
};

App.prototype.init = function () {
	this.defineConfig();
	this.prepareLowlevel();
	this.prepareUnits();
	this.applyContract();
};

App.prototype.prepareLowlevel = function () {
	this.defineLowlevel();
	this.initLowlevel();
};

App.prototype.defineLowlevel = function () {
	this.lowlevel = new Lowlevel(this.config);
};

App.prototype.initLowlevel = function () {
	this.lowlevel.init();
};

App.prototype.prepareUnits = function () {
	this.defineUnits();
	this.addUnits();
	this.initUnits();
};

App.prototype.defineUnits = function () {
	this.units = new Units();
};

App.prototype.addUnits = function () {
};

App.prototype.initUnits = function () {
	this.units.init();
};

App.prototype.setContract = function (contract) {
	this.contract = contract;
	this.lowlevel.setHandler(contract);
};


module.exports = App;

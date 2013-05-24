"use strict";
var SettingsBase = function () {
};

SettingsBase.prototype.unitIsInitRequired = true;

SettingsBase.prototype.unitInit = function (units) {
	this.prepare();
};

SettingsBase.prototype.prepare = function () {
	this.init();
	this.applyLocal();
};

SettingsBase.prototype.init = function () {
};

SettingsBase.prototype.getSettingsLocal = function () {
	return null;
};

SettingsBase.prototype.applyLocal = function () {
	var settingsLocal = this.getSettingsLocal();
	if (settingsLocal != null) {
		settingsLocal.update(this);
	}
};


module.exports = SettingsBase;

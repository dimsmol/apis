define([],
function () {
"use strict";

var inherits = function(childCtor, parentCtor) {
	var TempCtor = function () {};
	TempCtor.prototype = parentCtor.prototype;
	childCtor.super_ = parentCtor;
	childCtor.prototype = new TempCtor();
	childCtor.prototype.constructor = childCtor;
};


return inherits;

});

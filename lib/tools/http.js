"use strict";
var isSuccess = function (status) {
	return status >= 200 && status < 300;
};


module.exports = {
	isSuccess: isSuccess
};

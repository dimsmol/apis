({
	baseUrl: "./src",
	name: "almond",
	include: "apis",
	packages: ["apis"],
	out: "min/apis.min.global.js",
	preserveLicenseComments: false,
	wrap: {
		start: "(function() {",
		end: "var apis = require('apis'); var old = window.apis; apis.noConflict = function () { window.apis = old; }; window.apis = apis; }());"
	}
})

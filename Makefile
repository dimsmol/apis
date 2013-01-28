js_all: js_min js_min_global

js_min:
	r.js -o client/build.min.js

js_min_global:
	r.js -o client/build.min.global.js

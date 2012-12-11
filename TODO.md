* new run scheme (provide starting up bin/)
* ability to operate without never?
* use domains for error handling and to ensure every request will be responded
* syslog

* client
	* introduce jsonp as separated class
	* and later batch
	* http
		* open before setting headers
		* headers translation
		* readystate - errors handling
	* response parsing - how?

## WARN

* extends http.IncomingMessage.prototype (just like express 2.X does)
* usage of undocumented res._headers (wrap setHeader, removeHeader instead?)
* JSONP has no origin-based restrictions, potential subject of distributed browser-based atacks (don't know good way to fix)
* no compression - add server.use(express.compress()); to mechanics/web after express migration to connect 2.X

## test page

* move to separate project
* use ace for highlighting (?)
* ability to copy/save/load requests

## batch

* review batches (possibly broken)
* ability to fetch less data than used in 'apply' (?)
* optionally fail on error

## misc

* move logging to standalone lib, leave wrapper here
	* introduce handlers

* add ability to specify pre and post handlers for contract
	* keep in mind nested contracts structure
	* actively use ctx during resolution
	* possibly move result functionality somewhere

* add fields handler
* add range (skip, limit) handler
* add tls handler

* make standard 'options' handler more informative (provide contract?)
* get rid of opt_connectionsToExclude in send - use iterators or whatever

* lightweight cluster master

## stats

* provide cluster stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)

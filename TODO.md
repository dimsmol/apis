* st: convert errors
* depend on express and sockjs (and on pg for npgt too)

* use domains for error handling and to ensure every request will be responded

* make sure apis can support compression from new connect (2.X)

* create a page allowing to easily make test requests
	* with autoconversion from common logical headers to HTTP headers

* get rid of express and use pure connect (or even pure http)
	* then separate transport req and res from my own - to not change standard classes (?)

* add ability to specify pre and post handlers for contract
	* keep in mind nested contracts structure
	* actively use ctx during resolution

## WARN

* usage of undocumented res._headers (wrap setHeader, removeHeader instead?)
* JSONP has no origin-based restrictions, potential subject of distributed browser-based atacks (don't know good way to fix)
* no compression - add server.use(express.compress()); to mechanics/web after express migration to connect 2.X

## batch

* review batches (possibly broken)
* ability to fetch less data than used in 'apply' (?)
* optionally fail on error

## misc

* move logging to standalone lib, leave wrapper here
	* introduce handlers

* add fields handler
* add range (skip, limit) handler
* add tls handler

* make standard 'options' handler more informative (provide contract?)
* get rid of opt_connectionsToExclude in send - use iterators or whatever

## stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)

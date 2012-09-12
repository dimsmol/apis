* fix bad error report on json parsing problems for sockets
* fix assymetric reaction on empty body for web and socket mechanics
* rename serial & requestSerial to requestId
* mechanics: check path before ctx construction

* create a page allowing to easily make test requests
	* with autoconversion from common logical headers to HTTP headers
* use domains for error handling and to ensure every request will be responded

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

* body parsing on demand
* cookie parsing on demand
* static must become part of contract

* make standard 'options' handler more informative (provide contract?)
* add standard HEAD request support
* implement url parsing for routing
* get rid of opt_connectionsToExclude in send - use iterators or whatever

## stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)

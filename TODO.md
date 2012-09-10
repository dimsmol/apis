* get rid of undocumented res._headers somehow (wrap setHeader, removeHeader?)

* think about usage of HTTP headers within sockets/batches/jsonp
* move 'method' to headers?
* move 'callback' to headers? - probably not, because used to recognize JSONP

* add HEAD request support
* mechanics: check path before ctx construction
* fix bad error report on json parsing problems for sockets
* fix assymetric reaction on empty body for web and socket mechanics

* make standard 'options' handler more informative (provide contract)

* add fields handler
* add range (skip, limit) handler

* create a page allowing to easily make test requests !!!

* use domains for error handling and to ensure every request will be responded !!!

* tls handler


* JSONP origin-based restriction, to prevent distributed browser-based atacks (how? is it possible at all?)

## compression

* add server.use(express.compress()); to mechanics/web after express migration to connect 2.X

## batch

* add opt handler set for batch (to allow specify auth, etc.)
* noBatch handler
* ability to fetch less data than used in 'apply' (?)
* optionally fail on error

## REST

* stateless all the way
* GET must be cacheable !!!
	* think about url & args, how to provide cacheable structure
* PUT vs POST
	* PUT is safe to repeat (example: update something)
	* POST is not safe to repeat - can create copies (example: create)
* DELETE is safe to repeat (just ensures that it's deleted)

## libs

* move logging to standalone lib, leave wrapper here
	* introduce handlers

## modularity

* body parsing on demand
* cookie parsing on demand
* static must become part of contract

## routing

* implement url parsing

## transport

* way to send custom headers along with message, both for send() and sendResult()
* way to specify headers to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

## stats

* add some kind of lifetime distribution
* add trembling users detection (frequently performing connect then disconnect) (?)

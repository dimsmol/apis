* replace send() with something sending exactly JSON (end()?)

* stat
	* add number of connections without endpoint
	* add number of endpoints with more than one connection
		* possibly details on such endpoints: which transport is used, how many connections they have
	* add trembling users detection (frequently performing connect then disconnect)

* think about sub-apps
	* app as Unit
	* static must become part of contract
	* ctx transition on descending to sub-app

* move things to ctx.core (?)

* move logging to standalone lib, leave wrapper here

* way to send custom header along with message, both for send() and sendResult()
* way to specify header to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

* multirequests
* ctx restore or cloning for multirequests

* implement dataspecs
* implement url parsing

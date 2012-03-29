* move all statistics collection out from library - use client code
* replace send() with something sending exactly JSON (end()?)

* think about sub-apps

* move errh to client or standalone library (ncbt)
* move logging to standalone lib, leaving wrapper here

* way to send custom header along with message, for both send() and sendResult()
* way to specify header to send for result handler
* get rid of opt_connectionsToExclude in send - use iterators or whatever

* multirequests
* ctx restore or cloning for multirequests

* implement dataspecs
* implement url parsing

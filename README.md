## Features

* units-based modular architecture
* loader
	* provides multiple running modes
		* provides app console
	* brings app parts together automatically
* flexible settings system
* advanced routing with contracts/resources
* ability to start multiple servers
	* allows to listen multiple ports, support HTTP+HTTPS, IP4+IP6, etc.
* cluster support
* domain support
* integrated daemonization
* logging
* multiple transports support:
	* websockets
	* JSONP
	* batch requests
* CORS-enabled
* number of useful handlers, including:
	* authentication
	* data parsing and validation
	* response serialization and validation
	* static files handling
* client libs for node.js and browser

## Security Note

All apis resources are by default fully CORS and JSONP available. You must use CSRF protection for all your authenticated requests (even for GET requests) and apis supports such protection by default too. Optionally, you can check Origin of your requests or disable CORS/JSONP functionality (completely or for choosen request handlers).

By default, apis philosophy is to allow cross-origin requests and be ready for them.

Also, by default, every resource will have 'options' handler providing resource description and it will not be protected by authentication or something. You can allways override this handler with null or your own variant.

## Handlers

Handler interface:

* `setup(chain)` - can be used to perform some interaction between handlers of chain, used by `Impl` and `Ret`
* `handle(ctx)` - async handle, must not throw any exceptions, use `ctx.error()` instead, usually must call `ctx.next()` at some point

## Test page

To get test page on `/test_page` add to your contract:

```js
cont('/test', [apis.testPage.contract])
```

## Apps known by Loader

* app - app itself, will be searched at cwd()+'/lib/app'
* cluster_master - cluster master app, will be searched at cwd()+'/lib/claster_master'
* daemon_master - daemon start/stop app, will be searched at cwd()+'/lib/daemon_master'

For any app, if it cannot be found, apis default will be used.

## Units known by Loader

* core.app - known by app actually (which also is loader), the app itself
* core.uncaught - uncaught exception handler
* core.logging - logging subsystem
	* core.logging.engines.syslog - syslog logging engine
* core.mechanics.web - web mechanics, enables responding on HTTP requests
* core.mechanics.socket - socket mechanics, enables web socket communications, runs on top of web mechanics
	* core.mechanics.socket.stat - web socket statistics

* core.settings - settings, will be searched at cwd()+'/lib/settings'
* core.handler - main app contract, will be searched at cwd()+'/lib/contract'

For both core.settings and core.handler units, if unit cannot be found, apis default will be used.

## REST notes

* stateless all the way
* GET must be cacheable !!!
	* think about url & args, how to provide cacheable structure
* PUT vs POST
	* PUT is safe to repeat (example: update something)
	* POST is not safe to repeat - can create copies (example: create)
* DELETE is safe to repeat (just ensures that it's deleted)

## License

MIT

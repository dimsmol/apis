## Security Note

All apis resources are by default fully CORS and JSONP available. You must use CSRF protection for all your authenticated requests (even for GET requests) and apis supports such protection by default too. Optionally, you can check Origin of your requests or disable CORS/JSONP functionality (completely or for choosen request handlers).

By default, apis philosophy is to allow cross-origin requests and be ready for them.

Also, by default, every resource will have 'options' handler providing resource description and it will not be protected by authentication or something. You can allways override this handler with null or your own variant.

## Handlers

Handler interface:

* `setup(chain)` - can be used to perform some interaction between handlers of chain, used by `Impl` and `Ret`
* `handle(ctx)` - async handle, must not throw any exceptions, use `ctx.error()` instead, usually must call `ctx.next()` at some point

HandlerSync interface:

* `setup(chain)` - same as in Handler
* `handle(ctx)` - do not override in regular handlers, use `handleSync(ctx)` instead
* `handleSync(ctx)` - sync handle, must not use `ctx.next`, `ctx.error` and `ctx.cb` directly or indirectly, but can throw exceptions and return value will be used as argument of `ctx.next` automatically

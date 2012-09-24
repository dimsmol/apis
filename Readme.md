## Security Note

All apis resources are by default fully CORS and JSONP available. You must use CSRF protection for all your authenticated requests (even for GET requests) and apis supports such protection by default too. Optionally, you can check Origin of your requests or disable CORS/JSONP functionality (completely or for choosen request handlers).

By default, apis philosophy is to allow cross-origin requests and be ready for them.

Also, by default, every resource will have 'options' handler providing resource description and it will not be protected by authentication or something. You can allways override this handler with null or your own variant.

## Handlers

Handler interface:

* `setup(chain)` - can be used to perform some interaction between handlers of chain, used by `Impl` and `Ret`
* `handle(ctx)` - async handle, must not throw any exceptions, use `ctx.error()` instead, usually must call `ctx.next()` at some point

## test page usage

To get test page on `/test_page/index.html` add to your contract:

```js
res.subpaths('/test_page', st(apis.tools.testPage.staticPath))
```

## REST notes

* stateless all the way
* GET must be cacheable !!!
	* think about url & args, how to provide cacheable structure
* PUT vs POST
	* PUT is safe to repeat (example: update something)
	* POST is not safe to repeat - can create copies (example: create)
* DELETE is safe to repeat (just ensures that it's deleted)

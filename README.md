# express-winston

[![Build Status](https://travis-ci.org/ChrisAlderson/express-winston.svg?branch=master)](https://travis-ci.org/ChrisAlderson/express-winston)
[![Coverage Status](https://coveralls.io/repos/github/ChrisAlderson/express-winston/badge.svg?branch=master)](https://coveralls.io/github/ChrisAlderson/express-winston?branch=master)
[![devDependency Status](https://david-dm.org/ChrisAlderson/express-winston/dev-status.svg)](https://david-dm.org/ChrisAlderson/express-winston?type=dev)

> [winston](https://github.com/winstonjs/winston) middleware for
[express.js](https://github.com/expressjs/express)

## Installation

    npm install winston express-winston

(supports node >= 6.3.0)

## Usage

`express-winston` provides middlewares for request and error logging of your
[express.js](https://github.com/expressjs/express) application.  It uses
'whitelists' to select properties from the request and response objects.

To make use of `express-winston`, you need to add the following to your
application:

In `package.json`:

```
{
  "dependencies": {
    "...": "...",
    "winston": "^3.0.0-rc1",
    "express-winston": "^3.0.0",
    "...": "..."
  }
}
```

In `server.js` (or wherever you need it):

```js
const winston = require('winston')
const expressWinston = require('express-winston')
```

### Request Logging

Use `expressWinston.logger(options)` to create a middleware to log your HTTP
requests.

``` js
const express = require('express')

const app = express()
app.use(expressWinston.logger())
app.use(router) // Notice how the router goes after the logger.
```

#### Options

```js
const options = {
  responseWhitelist: [String]       // Array of response properties to log.
                                    // Overrides global responseWhitelist for
                                    // this instance.

  requestWhitelist: [String]        // Array of request properties to log.
                                    // Overrides global requestWhitelist for
                                    // this instance.

  bodyWhitelist: [String]           // Array of body properties to log.
                                    // Overrides global bodyWhitelist for this
                                    // instance.

  bodyBlacklist: [String]           // Array of body properties to omit from
                                    // logs. Overrides global bodyBlacklist for
                                    // this instance.

  requestFilter(req, propName) {    // A function to filter/return request
    return Object                   // values, defaults to returning all
  }                                 // values allowed by whitelist. If the
                                    // function returns undefined, the
                                    // key/value will not be included in the
                                    // meta.
   
  responseFilter(res, propName) {   // A function to filter/return response
    return Object                   // values, defaults to returning all
  }                                 // values allowed by whitelist. If the
                                    // function returns undefined, the
                                    // key/value will not be included in the
                                    // meta.

  ignoredRoutes: [String]           // Array of paths to ignore/skip logging.
                                    // Overrides global ignoredRoutes for this
                                    // instance.

  ignoreRoute(req, res) {           // A function to determine if logging is
     return Boolean                 // skipped, defaults to returning false.
  }                                 // Called _before_ any later middleware.

  skip(req, res) {                  // A function to determine if logging
    return Boolean                  // is skipped, defaults to returning false.
  }                                 // Called _after_ response has already been
                                    // sent.

  winstonInstance: <WinstonLogger>, // A winston logger instance. If this is
                                    // provided the transports option is
                                    // ignored.

  msg(req, res, err) {              // Customize the default logging message. 
    return Sring 
  } 

  baseMeta: Object,                 // Default meta data to be added to log,
                                    // this will be merged with the error data.

  metaField: String,                // If defined, the meta data will be added
                                    // in this field instead of the meta root
                                    // object.

  dynamicMeta(req, res, err) {      // Extract additional meta data from
    return [Object]                 // request or response (typically req.user
  }                                 // data if using passport). meta must be
                                    // true for this function to be activated

  level(req, res, err) {            // Custom log level for errors (default is
    return String                   // 'error'). Assign a function to
  }                                 // dynamically set the log level based on
                                    // request, response, and the exact error.
                                    // Can also be a plain string.

  statusLevels: Boolean or Object   // Different HTTP status codes caused log
                                    // messages to be logged at different
                                    // levels (info/warn/error), the default is
                                    // false. Use an object to control the
                                    // levels various status codes are logged
                                    // at. Using an object for statusLevels
                                    // overrides any setting of options.level.
}
app.use(expressWinston.logger(options))
```

### Error Logging

Use `expressWinston.errorLogger(options)` to create a middleware that log the
errors of the pipeline.

``` js
const express = require('express')

const app = express()
app.use(router) // Notice how the router goes first.
app.use(expressWinston.errorLogger())
```

The logger needs to be added AFTER the express router(`app.router)`) and BEFORE
any of your custom error handlers(`express.handler`). Since express-winston
will just log the errors and not __handle__ them, you can still use your custom
error handler like `express.handler`, just be sure to put the logger before any
of your handlers.

#### Options

```js
const options = {
  requestWhitelist: [String]        // Array of request properties to log.
                                    // Overrides global requestWhitelist for
                                    // this instance.

  requestFilter(req, propName) {    // A function to filter/return request
    return Object                   // values, defaults to returning all
  }                                 // values allowed by whitelist. If the
                                    // function returns undefined, the
                                    // key/value will not be included in the
                                    // meta.

  winstonInstance: <WinstonLogger>, // A winston logger instance. If this is
                                    // provided the transports option is
                                    // ignored.

  msg(req, res, err) {              // Customize the default logging message. 
    return Sring 
  } 

  baseMeta: Object,                 // Default meta data to be added to log,
                                    // this will be merged with the error data.

  metaField: String,                // If defined, the meta data will be added
                                    // in this field instead of the meta root
                                    // object.

  dynamicMeta(req, res, err) {      // Extract additional meta data from
    return [Object]                 // request or response (typically req.user
  }                                 // data if using passport). meta must be
                                    // true for this function to be activated

  level(req, res, err) {            // Custom log level for errors (default is
    return String                   // 'error'). Assign a function to
  }                                 // dynamically set the log level based on
                                    // request, response, and the exact error.
                                    // Can also be a plain string.
}
app.use(expressWinston.errorLogger(options))
```

If you're using a winston logger instance elsewhere and have already set up
levels and transports, pass the instance into expressWinston with the
`winstonInstance` option.

## Examples

``` js
const bodyParser = require('body-parser')
const express = require('express')
const expressWinston = require('express-winston')
const methodOverride = require('method-override')
const winston = require('winston')

const app = express()

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())
app.use(methodOverride())

// Let's make our express `Router` first.
const router = express.Router()
router.get('/error', (req, res, next) => {
  // Here we cause an error in the pipeline so we see express-winston in
  // action.
  const msg = 'This is an error and it should be logged to the console'
  return next(new Error(msg))
});

router.get('/', (req, res, next) => {
  const msg = 'This is a normal request, it should be logged to the console'
  return res.json({ msg })
})

// Create a winston instance, can be configured however you want.
const winstonInstance = winston.createLogger({
  transports: new winston.transports.Console({
    format: winston.format.json({
      space: 2
    })
  })
})

// express-winston logger makes sense BEFORE the router.
app.use(expressWinston.logger({ winstonInstance }))

// Now we can tell the app to use our routing code.
app.use(router)

// express-winston errorLogger makes sense AFTER the router.
app.use(expressWinston.errorLogger({ winstonInstance }))

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`express-winston demo listening on port ${port}`)
})

module.exports = app
```

Browse `/` to see a regular HTTP logging like this:

```json
{
  "req": {
    "url": "/",
    "headers": {
      "host": "193.70.43.199:3000",
      "connection": "keep-alive",
      "x-postman-interceptor-id": "4fb3ba8b-1d19-ddb5-4293-564ff989db70",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      "accept": "*/*",
      "accept-encoding": "gzip, deflate",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
    },
    "method": "GET",
    "httpVersion": "1.1",
    "originalUrl": "/",
    "query": {}
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 4,
  "level": "info",
  "message": "HTTP GET /"
}
```

Browse `/error` will show you how express-winston handles and logs the errors
in the express pipeline like this:

```json
{
  "meta": {
    "error": {},
    "level": "error",
    "message": "uncaughtException: This is an error and it should be logged to the console\nError: This is an error and it should be logged to the console\n    at router.get (/root/test/index.js:21:15)\n    at Layer.handle [as handle_request] (/root/test/node_modules/express/lib/router/layer.js:95:5)\n    at next (/root/test/node_modules/express/lib/router/route.js:137:13)\n    at Route.dispatch (/root/test/node_modules/express/lib/router/route.js:112:3)\n    at Layer.handle [as handle_request] (/root/test/node_modules/express/lib/router/layer.js:95:5)\n    at /root/test/node_modules/express/lib/router/index.js:281:22\n    at Function.process_params (/root/test/node_modules/express/lib/router/index.js:335:12)\n    at next (/root/test/node_modules/express/lib/router/index.js:275:10)\n    at Function.handle (/root/test/node_modules/express/lib/router/index.js:174:3)\n    at router (/root/test/node_modules/express/lib/router/index.js:47:12)",
    "stack": "Error: This is an error and it should be logged to the console\n    at router.get (/root/test/index.js:21:15)\n    at Layer.handle [as handle_request] (/root/test/node_modules/express/lib/router/layer.js:95:5)\n    at next (/root/test/node_modules/express/lib/router/route.js:137:13)\n    at Route.dispatch (/root/test/node_modules/express/lib/router/route.js:112:3)\n    at Layer.handle [as handle_request] (/root/test/node_modules/express/lib/router/layer.js:95:5)\n    at /root/test/node_modules/express/lib/router/index.js:281:22\n    at Function.process_params (/root/test/node_modules/express/lib/router/index.js:335:12)\n    at next (/root/test/node_modules/express/lib/router/index.js:275:10)\n    at Function.handle (/root/test/node_modules/express/lib/router/index.js:174:3)\n    at router (/root/test/node_modules/express/lib/router/index.js:47:12)",
    "exception": true,
    "date": "Thu Dec 07 2017 13:14:57 GMT+0100 (CET)",
    "process": {
      "pid": 10993,
      "uid": 0,
      "gid": 0,
      "cwd": "/root",
      "execPath": "/usr/local/bin/node",
      "version": "v9.2.0",
      "argv": [
        "/usr/local/bin/node",
        "/root/test/index.js"
      ],
      "memoryUsage": {
        "rss": 40235008,
        "heapTotal": 18694144,
        "heapUsed": 11331800,
        "external": 265979
      }
    },
    "os": {
      "loadavg": [
        0,
        0,
        0
      ],
      "uptime": 518868
    },
    "trace": [
      {
        "column": 15,
        "file": "/root/test/index.js",
        "function": "router.get",
        "line": 21,
        "method": "get",
        "native": false
      },
      ...   
    ],
    "req": {
      "url": "/error",
      "headers": {
        "host": "193.70.43.199:3000",
        "connection": "keep-alive",
        "x-postman-interceptor-id": "57e1a8b3-86fe-99fc-cc83-826683bb1240",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
        "accept": "*/*",
        "accept-encoding": "gzip, deflate",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
      },
      "method": "GET",
      "httpVersion": "1.1",
      "originalUrl": "/error",
      "query": {}
    }
  },
  "level": "error",
  "message": "HTTP GET /error This is an error and it should be logged to the console"
}
```

## Global Whitelists and Blacklists

`express-winston` exposes three whitelists that control which properties of the
`request`, `body`, and `response` are logged:

* `requestWhitelist`
* `bodyWhitelist` & `bodyBlacklist`
* `responseWhitelist`

For example, `requestWhitelist` defaults to:

```js
exports.requestWhitelist = [
  'url',
  'headers',
  'method',
  'httpVersion',
  'originalUrl',
  'query'
]
```

Only those properties of the request object will be logged. Set or modify the
whitelist as necessary.

For example, to include the session property (the session data), add the
following during logger setup:

```js
expressWinston.requestWhitelist.push('session')
```

The blacklisting excludes certain properties and keeps all others. If both
`bodyWhitelist` and `bodyBlacklist` are set the properties excluded by the
blacklist are not included even if they are listed in the whitelist!

Example:

```js
expressWinston.bodyBlacklist.push('secretid', 'secretproperty')
```

Note that you can log the whole request and/or response body:

```js
expressWinston.requestWhitelist.push('body')
expressWinston.responseWhitelist.push('body')
```

## Route-Specific Whitelists and Blacklists

`express-winston` adds a `_routeWhitelists` object to the `req`uest, containing
`.body`, `.req` and .res` properties, to which you can set an array of
'whitelist' parameters to include in the log, specific to the route in
question:

```js
router.post('/user/register', (req, res, next) => {
  // But not 'password' or 'confirm-password' or 'top-secret'
  req._routeWhitelists.body = [
    'username',
    'email',
    'age'
  ]
  req._routeWhitelists.res = ['_headers']
})
```

Post to `/user/register` would give you something like the following:

```json
{
  "req": {
    "url": "/user/register",
    "headers": {
      "host": "193.70.43.199:3000",
      "connection": "keep-alive",
      "content-length": "62",
      "origin": "chrome-extension://aicmkgpgakddgnaphhhpliifpcfhicfo",
      "x-postman-interceptor-id": "4c4d47f2-3777-d7c5-7b3f-873d8cf6b341",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36",
      "content-type": "application/json",
      "accept": "*/*",
      "accept-encoding": "gzip, deflate",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
    },
    "method": "POST",
    "httpVersion": "1.1",
    "originalUrl": "/user/register",
    "query": {},
    "body": {
      "username": "myUsername",
      "email": "myEmail",
      "age": 69
    }
  },
  "res": {
    "statusCode": 200,
    "_headers": {
      "x-powered-by": "Express",
      "vary": "X-HTTP-Method-Override"
    }
  },
  "responseTime": 0,
  "level": "info",
  "message": "HTTP POST /user/register"
}
```

Blacklisting supports only the `body` property.


``` js
router.post('/user/register', (req, res, next) => {
  // But not 'password' or 'confirm-password' or 'top-secret'
  req._routeWhitelists.body = [
    'username',
    'email',
    'age'
  ]
  req._routeBlacklists.body = [
    'username',
    'password',
    'confirm-password',
    'top-secret'
  ]
  req._routeWhitelists.res = ['_headers']
})
```

If both `req._bodyWhitelist.body` and `req._bodyBlacklist.body` are set the
result will be the white listed properties excluding any black listed ones. In
the above example, only 'email' and 'age' would be included.

## Custom Status Levels

If you set statusLevels to true express-winston will log sub 400 responses at
info level, sub 500 responses as warnings and 500+ responses as errors. To
change these levels specify an object as follows:

```js
const options = { 
  statusLevels: {
    success: 'debug',
    warn: 'debug',
    error: 'info'
  }
}
app.use(expressWinston.logger(options))
```

## Dynamica Status Levels

If you set statusLevels to false and assign a function to level, you can
customize the log level for any scenario.

```js
const options = {
  statusLevels: false // default value
  level(req, res) {
    let level = '' 

    if (res.statusCode >= 100) {
      level = 'info'
    }
    if (res.statusCode >= 400) {
      level = 'warn'
    }
    if (res.statusCode >= 500) {
      level = 'error'
    }

    // Ops is worried about hacking attempts so make Unauthorized and Forbidden
    // critical
    if (res.statusCode == 401 || res.statusCode == 403) {
      level = 'critical'
    }

    // No one should be using the old path, so always warn for those
    if (req.path === '/v1' && level === 'info') {
      level = "warn"
    }

    return level
  }
}
app.use(expressWinston.logger(options))
```

## Dynamic meta data from request or response

If you set dynamicMeta function you can extract additional meta data fields
from request or response objects. The function can be used to either select
relevant elements in request or response body without logging them as a whole
or to extract runtime data like the user making the request. The example below
logs the user name and role as assigned by the passport authentication
middleware.

```js
const options = {
  meta: true,
  dynamicMeta(req, res) {
    return {
      user: req.user ? req.user.username : null,
      role: req.user ? req.user.role : null
    }
  }
}
app.use(expressWinston.logger(options))
```

## Tests

Run the basic Mocha tests and generate the `./coverage/` coverage report:

```
 $ npm run test
```

## Issues and Collaboration

If you ran into any problems, please use the project 
[Issues section](https://github.com/bithavoc/express-winston/issues) to search
or post any bug.

## Contributors

* [Johan Hernandez](https://github.com/bithavoc) (https://github.com/bithavoc)
* [Lars Jacob](https://github.com/jaclar) (https://github.com/jaclar)
* [Jonathan Lomas](https://github.com/floatingLomas) (https://github.com/floatingLomas)
* [Ross Brandes](https://github.com/rosston) (https://github.com/rosston)

Also see AUTHORS file, add yourself if you are missing.

## MIT License

Copyright (c) 2012-2017 Bithavoc.io and Contributors - http://bithavoc.io

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

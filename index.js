/**
 * Copyright (c) 2012-2014 Heapsource.com and Contributors - http://www.heapsource.com
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const winston = require('winston')

/**
 * A default list of properties in the request object that are allowed to be
 * logged. These properties will be safely included in the meta of the log.
 * 'body' is not included in this list because it can contains passwords and
 * stuff that are sensitive for logging.
 * @type {Array<string>}
 */
exports.requestWhitelist = [
  'url',
  'headers',
  'method',
  'httpVersion',
  'originalUrl',
  'query'
]

/**
 * A default list of properties in the response object that are allowed to be
 * logged. These properties will be safely included in the meta of the log.
 * @type {Array<string>}
 */
exports.responseWhitelist = ['statusCode']

/**
 * A default list of properties in the request body that are allowed to be
 * logged. This will normally be empty here, since it should be done at the
 * route level.
 * @type {Array<string>}
 */
exports.bodyWhitelist = []

/**
 * A default list of properties in the request body that are not allowed to be
 * logged.
 * @type {Array<string>}
 */
exports.bodyBlacklist = []

/**
 * A list of request routes that will be skipped instead of being logged. This
 * would be useful if routes for health checks or pings would otherwise pollute
 * your log files.
 * @type {Array<string>}
 */
exports.ignoredRoutes = []

/**
 * A default function to filter the properties of the req object.
 * @param {!Object} req - The request object to filter.
 * @param {!Object} propName - The property to filter filter from the request
 * object.
 * @returns {Object} - The filtered property.
 */
exports.defaultRequestFilter = (req, propName) => req[propName]

/**
 * A default function to filter the properties of the res object.
 * @param {!Object} res - The response object to filter.
 * @param {!Object} propName - The property to filter filter from the response
 * object.
 * @returns {Object} - The filtered property.
 */
exports.defaultResponseFilter = (res, propName) => res[propName]

/**
 * A default function to decide whether skip logging of particular request.
 * Doesn't skip anything (i.e. log all requests).
 * @returns {boolean} - Defaults to false.
 */
exports.defaultSkip = () => false

/**
 * The default winston instance to use.
 * @type {Object}
 */
exports.defaultWinstonInstance = winston.createLogger({
  transports: new winston.transports.Console({
    format: winston.format.json({
      space: 2
    })
  })
})

/**
 * Filter an object with a whitelist.
 * @todo Replace `forEach` with reduce?
 * @param {!Object} originalObj - The
 * @param {!Array<string>} whiteList - The
 * @param {!Function} initialFilter - The filter function to filter the list.
 * @returns {Objecct|undefined} - The filtered object or undefined.
 */
function filterObject(originalObj, whiteList, initialFilter) {
  const obj = {}
  let fieldsSet = false

  whiteList.forEach(propName => {
    const value = initialFilter(originalObj, propName)

    if (typeof value !== 'undefined') {
      obj[propName] = value
      fieldsSet = true
    }
  })

  return fieldsSet ? obj : undefined
}

/**
 * function errorLogger(options)
 * @param {!Object} options - to initialize the middleware.
 * @returns {Function} - Middleware function for express.
*/
exports.errorLogger = ({
  requestWhitelist = exports.requestWhitelist,
  requestFilter = exports.defaultRequestFilter,
  winstonInstance = exports.defaultWinstonInstance,
  transports,
  msg = (req, res, err) => {
    return `HTTP ${req.method} ${req.url} ${err.message}`
  },
  baseMeta = {},
  metaField = null,
  level = 'error',
  dynamicMeta
} = {}) => {
  return (err, req, res, next) => {
    let metaObj = winston.exceptions.getAllInfo(err)
    metaObj.req = filterObject(req, requestWhitelist, requestFilter)

    // TODO: Move to enrichMeta function?
    if (dynamicMeta) {
      Object.assign(metaObj, dynamicMeta(req, res, err))
    }
    if (metaField) {
      metaObj = {
        [metaField]: metaObj
      }
    }
    Object.assign(metaObj, baseMeta)

    const message = msg(req, res, err)
    const l = typeof level === 'function' ? level(req, res, err) : level
    const logger = transports
      ? winston.createLogger({
        transports: Array.isArray(transports) ? transports : [transports]
      })
      : winstonInstance
    logger.log({
      level: l,
      message,
      meta: metaObj
    })

    return next(err)
  }
}

/**
 * Get the level from a status code.
 * @param {!number} statusCode - The status code to check.
 * @param {!Object} statusLevels - The status level object to get the level
 * from.
 * @returns {string} - A log level.
 */
function levelFromStatus(statusCode, statusLevels) {
  let level = 'info'
  if (statusCode >= 200) {
    level = statusLevels.success || 'info'
  }
  if (statusCode >= 400) {
    level = statusLevels.warn || 'warn'
  }
  if (statusCode >= 500) {
    level = statusLevels.error || 'error'
  }

  return level
}

/**
 * Parse a body objecct to a string.
 * @param {!Object} body - The body to parse.
 * @param {!boolean} isJson - Boolean to check if the body is json.
 * @returns {string} - The parsed body as a string.
 */
function bodyToString(body, isJson) {
  const stringBody = body && body.toString()

  if (isJson) {
    return JSON.parse(body)
  }

  return stringBody
}

/**
 * Filter the body object based on the bodyWhitelist and bodyBlacklist.
 * @param {!Object} options - The options to filter the body.
 * @returns {Object|undefined} - The filtered body.
 */
function filterBody({
  req,
  requestWhitelist,
  requestFilter,
  bodyWhitelist,
  bodyBlacklist
}) {
  if (!req.body) {
    return
  }

  if (bodyBlacklist.length > 0 && bodyWhitelist.length === 0) {
    const whitelist = Object.keys(req.body).concat(bodyBlacklist)
      .filter((elem, pos, arr) => arr.indexOf(elem) === pos)

    return filterObject(req.body, whitelist, requestFilter)
  } else if (
    requestWhitelist.indexOf('body') >= -1 &&
      bodyWhitelist.length === 0 &&
      bodyBlacklist.length === 0
  ) {
    return filterObject(req.body, Object.keys(req.body), requestFilter)
  }

  return filterObject(req.body, bodyWhitelist, requestFilter)
}

/**
 * function logger(options)
 * @param {Object} options to initialize the middleware.
 * @returns {Function} - Middleware function for express.
*/
exports.logger = ({
  requestWhitelist = exports.requestWhitelist,
  responseWhitelist = exports.responseWhitelist,
  bodyWhitelist = exports.bodyWhitelist,
  bodyBlacklist = exports.bodyBlacklist,
  requestFilter = exports.defaultRequestFilter,
  responseFilter = exports.defaultResponseFilter,
  ignoredRoutes = exports.ignoredRoutes,
  winstonInstance = exports.defaultWinstonInstance,
  transports,
  statusLevels = false,
  level = 'info',
  msg = (req, res) => {
    return `HTTP ${req.method} ${req.url}`
  },
  baseMeta = {},
  metaField = null,
  ignoreRoute = () => false,
  skip = exports.defaultSkip,
  meta = true,
  dynamicMeta
} = {}) => {
  return (req, res, next) => {
    req._startTime = new Date()
    req._routeWhitelists = {
      req: [],
      res: [],
      body: []
    }
    req._routeBlacklists = {
      body: []
    }
    req.url = req.originalUrl || req.url

    if (ignoredRoutes.indexOf(req.url) > -1) {
      return next()
    }
    if (ignoreRoute(req, res)) {
      return next()
    }
    if (skip(req, res)) {
      return next()
    }

    const l = typeof level === 'function' ? level(req, res) : statusLevels
      ? levelFromStatus(res.statusCode, statusLevels) : level

    const { end } = res
    res.end = (chunk, encoding) => {
      res.responseTime = new Date() - req._startTime
      res.end = end
      res.end(chunk, encoding)

      let metaObj = {}
      if (meta === true) {
        const reqWhitelist = [].concat(
          requestWhitelist,
          req._routeWhitelists.req
        )
        const resWhitelist = [].concat(
          responseWhitelist,
          req._routeWhitelists.res
        )

        Object.assign(metaObj, {
          req: filterObject(req, reqWhitelist, requestFilter),
          res: filterObject(res, resWhitelist, responseFilter),
          responseTime: res.responseTime
        })

        if (responseWhitelist.indexOf('body') > -1) {
          const contentType = res._headers['content-type']
          const isJson = contentType && contentType.indexOf('json') >= 0

          metaObj.res.body = bodyToString(chunk, isJson)
        }

        const filteredBody = filterBody({
          req,
          requestWhitelist,
          requestFilter,
          bodyWhitelist: [].concat(
            bodyWhitelist,
            req._routeWhitelists.body
          ),
          bodyBlacklist: [].concat(
            bodyBlacklist,
            req._routeBlacklists.body
          )
        })

        if (metaObj.req) {
          if (filteredBody) {
            metaObj.req.body = filteredBody
          } else {
            delete metaObj.req.body
          }
        }

        // TODO: Move to enrichMeta function?
        if (dynamicMeta) {
          Object.assign(metaObj, dynamicMeta(req, res))
        }
        if (metaField) {
          metaObj = {
            [metaField]: metaObj
          }
        }
        Object.assign(metaObj, baseMeta)
      }

      const message = msg(req, res)
      const logger = transports
        ? winston.createLogger({
          transports: Array.isArray(transports) ? transports : [transports]
        })
        : winstonInstance
      logger.log({
        level: l,
        message,
        meta: metaObj
      })
    }

    return next()
  }
}

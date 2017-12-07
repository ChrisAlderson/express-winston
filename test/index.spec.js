/* eslint-disable no-unused-expressions */
/* eslint-disable require-jsdoc */
const http = require('http')
const request = require('supertest')
const sinon = require('sinon')

const expressWinston = require('..')

/** @test {express-winston} */
describe('express-winston', () => {
  let winstonStub

  before(() => {
    const winstonInstance = expressWinston.defaultWinstonInstance
    winstonStub = sinon.stub(winstonInstance, 'log')
  })

  function handleResponse(err, res) {
    res.statusCode = err ? (err.status || 500) : res.statusCode
    const message = err ? err.message : 'OK'

    res.end(JSON.stringify({ message }))
  }

  function handleLogger(logger, req, res, error) {
    if (error) {
      return logger(error, req, res, err => handleResponse(err, res))
    }

    return logger(req, res, err => handleResponse(err, res))
  }

  function createServer({
    logger,
    statusCode,
    contentType,
    reqBody,
    error
  }) {
    return http.createServer((req, res) => {
      req.body = reqBody

      res.statusCode = statusCode
      res.setHeader('Content-Type', contentType)

      return handleLogger(logger, req, res, error)
    })
  }

  function executeTest({
    message,
    logger,
    statusCode = 200,
    contentType = 'application/json',
    reqBody,
    error
  }) {
    it(message, done => {
      const server = createServer({
        logger,
        statusCode,
        contentType,
        reqBody,
        error
      })
      request(server).get('/')
        .then(() => done())
        .catch(done)
    })
  }

  const cases = [{
    message: 'should log without any options',
    logger: expressWinston.logger()
  }, {
    message: 'should ignore the route with \'ignoredRoutes\'',
    logger: expressWinston.logger({
      ignoredRoutes: ['/']
    })
  }, {
    message: 'should ignore the route with \'ingoreRoute\'',
    logger: expressWinston.logger({
      ignoreRoute(req, res) {
        return req.url === '/'
      }
    })
  }, {
    message: 'should skip the route with \'skip\'',
    logger: expressWinston.logger({
      skip(req, res) {
        return req.url === '/'
      }
    })
  }, {
    message: 'should get the log level with \'level(req, res)\'',
    logger: expressWinston.logger({
      level(req, res) {
        return 'info'
      }
    })
  }, {
    message: 'should get the log level \'warn\' with \'level\' & \'statusLevels\'',
    logger: expressWinston.logger({
      level: true,
      statusLevels: {}
    }),
    statusCode: 102
  }, {
    message: 'should get the log level \'warn\' with \'level\' & \'statusLevels\'',
    logger: expressWinston.logger({
      level: true,
      statusLevels: {}
    }),
    statusCode: 200
  }, {
    message: 'should get the log level \'warn\' with \'level\' & \'statusLevels\'',
    logger: expressWinston.logger({
      level: true,
      statusLevels: {}
    }),
    statusCode: 400
  }, {
    message: 'should get the log level \'warn\' with \'level\' & \'statusLevels\'',
    logger: expressWinston.logger({
      level: true,
      statusLevels: {}
    }),
    statusCode: 500
  }, {
    message: 'should not print the meta of the request',
    logger: expressWinston.logger({
      meta: false
    })
  }, {
    message: 'should print the json body of the response',
    logger: expressWinston.logger({
      responseWhitelist: [].concat(
        expressWinston.responseWhitelist,
        ['body']
      )
    })
  }, {
    message: 'should print the json body of the response',
    logger: expressWinston.logger({
      responseWhitelist: [].concat(
        expressWinston.responseWhitelist,
        ['body']
      )
    }),
    contentType: 'application/xml'
  }, {
    message: 'should not print the request object',
    logger: expressWinston.logger({
      requestWhitelist: []
    })
  }, {
    message: 'should blacklist \'body.foo\'',
    logger: expressWinston.logger({
      bodyBlacklist: ['foo']
    }),
    reqBody: {
      foo: 'bar'
    }
  }, {
    message: 'should blacklist \'body.foo\' and whitelist \'body.baz\'',
    logger: expressWinston.logger({
      bodyBlacklist: ['foo'],
      bodyWhitelist: ['baz']
    }),
    reqBody: {
      foo: 'bar',
      baz: 'qux'
    }
  }, {
    message: 'should filter the body with empty black and whitelists',
    logger: expressWinston.logger({
      bodyBlacklist: [],
      bodyWhitelist: []
    }),
    reqBody: {
      foo: 'bar'
    }
  }, {
    message: 'should add dynamic meta to the meta object',
    logger: expressWinston.logger({
      dynamicMeta() {
        return {
          foo: 'bar'
        }
      }
    })
  }, {
    message: 'should reassign the meta field',
    logger: expressWinston.logger({
      metaField: 'foo'
    })
  }, {
    message: 'should error log without any options',
    logger: expressWinston.errorLogger(),
    error: new Error()
  }, {
    message: 'should add dynamic meta to the meta object',
    logger: expressWinston.errorLogger({
      dynamicMeta() {
        return {
          foo: 'bar'
        }
      }
    }),
    error: new Error()
  }, {
    message: 'should reassign the meta field',
    logger: expressWinston.errorLogger({
      metaField: 'foo'
    }),
    error: new Error()
  }, {
    message: 'should get the log level with \'level(req, res, err)\'',
    logger: expressWinston.errorLogger({
      level(req, res, err) {
        return 'info'
      }
    }),
    error: new Error()
  }]
  cases.map(executeTest)

  after(() => {
    winstonStub.restore()
  })
})

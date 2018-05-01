'use strict'

// Create an express app.
const express = require('express')
const app = express()

// Use the express-winston middleware before we setup the routes.
const expressWinston = require('..')
app.use(expressWinston.logger())

// Setup some routes to demonstrate.
app.all('/ok', (req, res) => {
  return res.send('ok')
})
app.all('/redirect', (req, res) => {
  return res.redirect('/ok')
})
app.all('/not-found', (req, res) => {
  return res.status(404).send('not found')
})
app.all('/error', (req, res, next) => {
  return next(new Error('not ok'))
})

// And have the error logger after you setup the routes.
app.use(expressWinston.errorLogger())

// Setup our own winston instance, because why not.
const winston = require('winston')
const logger = winston.createLogger({
  transports: new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
})

// Run the app!
const port = process.env.PORT || 3000
app.listen(port, err => {
  if (err) {
    logger.error(err.message)
    process.exit(1)
  }

  logger.info(`app listening on port: ${port}`)
})

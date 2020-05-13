/**
 * Epicalytic
 * @Author Udara Premadasa
 * @module Application
 */

const express = require('express');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
const logger = require('./logger.app');
const env = process.env;
const app = express();
require('./app.validation').check(function(err) {
  if (err) process.exit(0);
});
require('./mongo/client').connect(function (err, db) {
  if (err) process.exit(0);
});
require('./redis.client').connect();
app.listen(env.APP_SERVER_PORT, () => logger.info(`${env.APP_NAME} started on ${env.APP_SERVER_PORT} and ${env.APP_RUNNING_PROFILE} environment!`)); // app listen
app.use(cookieParser());
app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", env.ORIGIN); // allow origin
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, request-id"); // allow headers
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT")
  next();
}); // add cors header
app.get('/stop', function (req, res) {
  logger.info("Stoping the server!!");
  res.json({ 'message': 'Stoped the server' });
  process.exit(1);
}); // Server Termination End point
app.use(require('./auth.request')); // user request authentication
app.use(require('./router')); // app routes
app.use(function (err, req, res, next) {
  logger.debug(`Responsed Error '${err.message}'`);
  let statusCode = err.statusCode || 500;
  delete err.statusCode;
  return res.status(statusCode).json(err);
}); // error handler

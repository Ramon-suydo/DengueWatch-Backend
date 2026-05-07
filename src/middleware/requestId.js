/**
 * Request ID Middleware
 * Generates unique ID for each request for tracing/logging
 */

const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
  req.id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = requestIdMiddleware;

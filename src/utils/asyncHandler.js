/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 * No need for try-catch in every controller
 */

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

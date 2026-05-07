const { createErrorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : null;

    const response = createErrorResponse(status, message, errorDetails);
    res.status(status).json(response);
};

module.exports = errorHandler;
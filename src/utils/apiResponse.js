/**
 * Standardized API Response Wrapper
 * Ensures all API responses follow consistent format:
 * { success: boolean, message: string, data: any, error?: string }
 */

class ApiResponse {
  constructor(statusCode, data, message = 'Success', success = true) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400 ? success : false;
  }
}

/**
 * Success response helper
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {ApiResponse}
 */
const createSuccessResponse = (statusCode = 200, data = null, message = 'Success') => {
  return new ApiResponse(statusCode, data, message, true);
};

/**
 * Error response helper
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} error - Detailed error (dev only)
 * @returns {ApiResponse}
 */
const createErrorResponse = (statusCode = 500, message = 'Internal Server Error', error = null) => {
  const response = new ApiResponse(statusCode, null, message, false);
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
  }
  return response;
};

module.exports = {
  ApiResponse,
  createSuccessResponse,
  createErrorResponse
};

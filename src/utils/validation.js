/**
 * Input Validation Utilities
 * Provides reusable validation functions for common data types
 */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cityRegex = /^[a-zA-Z\s\-\(\)\.]+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
};

/**
 * Validate password strength
 * Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password
 * @returns {object} { valid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate city name
 * @param {string} city
 * @returns {boolean}
 */
const isValidCity = (city) => {
  return typeof city === 'string' && city.trim().length > 0 && city.length <= 100 && cityRegex.test(city);
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateString
 * @returns {boolean}
 */
const isValidDate = (dateString) => {
  if (!dateRegex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate positive integer
 * @param {any} value
 * @returns {boolean}
 */
const isValidPositiveInteger = (value) => {
  return Number.isInteger(value) && value >= 0;
};

/**
 * Validate user role
 * @param {string} role
 * @returns {boolean}
 */
const isValidRole = (role) => {
  return ['admin', 'user'].includes(role);
};

/**
 * Trim and validate string input
 * @param {string} input
 * @param {number} minLength
 * @param {number} maxLength
 * @returns {object} { valid: boolean, value: string, error: string }
 */
const validateString = (input, minLength = 1, maxLength = 255) => {
  if (typeof input !== 'string') {
    return { valid: false, value: '', error: 'Input must be a string' };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return { valid: false, value: '', error: `Input must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, value: '', error: `Input must not exceed ${maxLength} characters` };
  }

  return { valid: true, value: trimmed, error: null };
};

/**
 * Sanitize string to prevent XSS
 * @param {string} input
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

module.exports = {
  isValidEmail,
  validatePassword,
  isValidCity,
  isValidDate,
  isValidPositiveInteger,
  isValidRole,
  validateString,
  sanitizeString
};

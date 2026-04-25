const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return sendError(res, 'Invalid or expired token', 401);
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return sendError(res, 'Access denied. Admins only.', 403);
    }
    next();
};

module.exports = { authenticate, authorizeAdmin };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');
const { isValidEmail, validatePassword, validateString } = require('../utils/validation');

exports.register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return sendError(res, 'Name, email and password are required', 400);
        }

        // Validate name
        const nameValidation = validateString(name, 2, 100);
        if (!nameValidation.valid) {
            return sendError(res, nameValidation.error, 400);
        }

        // Validate email
        if (!isValidEmail(email)) {
            return sendError(res, 'Invalid email format', 400);
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return sendError(res, passwordValidation.errors[0], 400);
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return sendError(res, 'Passwords do not match', 400);
        }

        // Check if user exists
        const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            return sendError(res, 'Email already registered', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: nameValidation.value,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        sendSuccess(res, {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }, 'Registered successfully', 201);

    } catch (error) {
        console.error('Register error:', error);
        sendError(res, 'Registration failed', 500);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return sendError(res, 'Invalid email format', 400);
        }

        const user = await User.findOne({ where: { email: email.toLowerCase() } });
        if (!user) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return sendError(res, 'Invalid credentials', 401);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        sendSuccess(res, {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        }, 'Login successful');

    } catch (error) {
        console.error('Login error:', error);
        sendError(res, 'Login failed', 500);
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return sendError(res, 'User not found', 404);
        }

        sendSuccess(res, user, 'User fetched successfully');
    } catch (error) {
        console.error('GetMe error:', error);
        sendError(res, 'Failed to fetch user', 500);
    }
};
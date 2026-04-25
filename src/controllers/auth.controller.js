const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/response');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return sendError(res, 'Name, email and password are required', 400);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return sendError(res, 'Email already in use', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
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
        sendError(res, 'Registration failed');
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 'Email and password are required', 400);
        }

        const user = await User.findOne({ where: { email } });
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
        sendError(res, 'Login failed');
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        sendSuccess(res, user, 'User fetched successfully');
    } catch (error) {
        console.error('GetMe error:', error);
        sendError(res, 'Failed to fetch user');
    }
};
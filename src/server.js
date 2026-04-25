require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const reportRoutes = require('./routes/report.routes');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');
const analyticsRoutes = require('./routes/analytics.routes');
const { developmentLogger, productionLogger } = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Security: HTTP Headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(productionLogger);
} else {
    app.use(developmentLogger);
}

// Security: Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per 15 minutes
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        data: null
    }
});
app.use('/api', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // max 10 login/register attempts per 15 minutes
    message: {
        success: false,
        message: 'Too many auth attempts, please try again later.',
        data: null
    }
});
app.use('/api/auth', authLimiter);

// Middleware
app.use(express.json({ limit: '10kb' })); // limit body size
app.use(cors());

// Routes and API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handler    
app.use(errorHandler);

sequelize.authenticate()
    .then(() => {
        console.log(' Database connected');
        return sequelize.sync();
    })
    .then(() => {
        console.log(' Tables synced');
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error(' Unable to connect to DB:', err);
    });
require('dotenv').config();

const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./config/database');
const reportRoutes = require('./routes/report.routes');
const authRoutes = require('./routes/auth.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler = require('./middleware/errorHandler');
const { developmentLogger, productionLogger } = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const predictionRoutes = require('./routes/prediction.routes');
const DengueCase = require('./models/dengueCase.model');

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
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, message: 'Too many requests, please try again later.', data: null }
});
app.use('/api', limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many auth attempts, please try again later.', data: null }
});
app.use('/api/auth', authLimiter);

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(cors());

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/prediction', predictionRoutes);
app.get('/debug/dengue', async (req, res) => {
    const DengueCase = require('./models/dengueCase.model');
    const count = await DengueCase.count();
    const sample = await DengueCase.findAll({ limit: 3 });
    res.json({ count, sample });
});
// Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log(' Database connected');
        await sequelize.sync();
        console.log(' Tables synced');
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error(' Unable to connect to DB:', err);
        process.exit(1);
    }
};

startServer();
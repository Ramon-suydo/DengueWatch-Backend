const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Write logs to file
const accessLogStream = fs.createWriteStream(
    path.join(logsDir, 'access.log'),
    { flags: 'a' }
);

const developmentLogger = morgan('dev');
const productionLogger = morgan('combined', { stream: accessLogStream });

module.exports = {
    developmentLogger,
    productionLogger
};
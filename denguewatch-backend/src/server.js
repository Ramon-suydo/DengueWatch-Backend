require('dotenv').config();

const express = require('express');
const app = express();  
const sequelize = require('./config/database');
const reportRoutes = require('./routes/report.routes');
const cors = require('cors');

// Middleware
app.use(express.json());
app.use(cors());
app.use('/api/reports', reportRoutes);

sequelize.authenticate()
    .then(() => {
        console.log(' Database connected');
        return sequelize.sync(); // creates tables
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
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/user.model');

const seedAdmin = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        await sequelize.sync();

        // Check if admin already exists
        const existing = await User.findOne({ where: { email: 'admin@denguewatch.com' } });
        if (existing) {
            console.log('Admin already exists!');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        await User.create({
            name: 'DengueWatch Admin',
            email: 'admin@denguewatch.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Admin account created successfully!');
        console.log('Email: admin@denguewatch.com');
        console.log('Password: admin123');
        process.exit(0);

    } catch (error) {
        console.error('Seeder error:', error);
        process.exit(1);
    }
};

seedAdmin();
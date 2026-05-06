require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const DengueCase = require('../models/dengueCase.model');

const NCR_CITIES = [
    'CALOOCAN CITY', 'LAS PINAS CITY', 'MAKATI CITY', 'MALABON CITY',
    'MANDALUYONG CITY', 'MANILA CITY', 'MARIKINA CITY', 'MUNTINLUPA CITY',
    'NAVOTAS CITY', 'PARANAQUE CITY', 'PASAY CITY', 'PASIG CITY',
    'PATEROS', 'QUEZON CITY', 'SAN JUAN CITY', 'TAGUIG CITY', 'VALENZUELA CITY'
];

const seedDOHData = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');
        await sequelize.sync();

        // Clear existing DOH data
        await DengueCase.destroy({ where: {}, truncate: true, force: true });
        console.log('Cleared existing DOH data');

        // Read CSV
        const csvPath = path.join(process.cwd(), 'doh-epi-dengue-data-2016-2021.csv');
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').slice(2); // Skip header rows

        const records = [];
        let skipped = 0;

        for (const line of lines) {
            if (!line.trim()) continue;

            const parts = line.split(',');
            if (parts.length < 5) continue;

            const city = parts[0].trim().toUpperCase();
            const cases = parseInt(parts[1]) || 0;
            const deaths = parseInt(parts[2]) || 0;
            const dateStr = parts[3].trim();
            const region = parts[4].trim();

            // Only import NCR cities
            if (!NCR_CITIES.includes(city)) {
                skipped++;
                continue;
            }

            // Parse date
            const dateParts = dateStr.split('/');
            if (dateParts.length < 3) continue;
            const month = parseInt(dateParts[0]);
            const day = parseInt(dateParts[1]);
            const year = parseInt(dateParts[2]);

            if (isNaN(month) || isNaN(day) || isNaN(year)) continue;

            records.push({
                city,
                cases,
                deaths,
                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                region: region.replace('\r', ''),
                year,
                month
            });
        }

        // Bulk insert
        await DengueCase.bulkCreate(records, { validate: true });
        console.log(` Successfully imported ${records.length} DOH records!`);
        console.log(` Skipped ${skipped} non-NCR records`);
        console.log(` Cities imported: ${NCR_CITIES.join(', ')}`);
        process.exit(0);

    } catch (error) {
        console.error('Seeder error:', error);
        process.exit(1);
    }
};

seedDOHData();
require('dotenv').config();
const sequelize = require('../config/database');
const Report = require('../models/report.model');

// Tondo barangay coordinates and population weights
// Based on actual Tondo, Manila barangay locations
const tondoBarangays = [
  { name: 'Barangay 1', lat: 14.6177, lng: 120.9686, weight: 0.8 },
  { name: 'Barangay 2', lat: 14.6189, lng: 120.9692, weight: 0.9 },
  { name: 'Barangay 3', lat: 14.6201, lng: 120.9698, weight: 0.7 },
  { name: 'Barangay 4', lat: 14.6213, lng: 120.9704, weight: 1.0 },
  { name: 'Barangay 5', lat: 14.6225, lng: 120.9710, weight: 0.6 },
  { name: 'Barangay 6', lat: 14.6237, lng: 120.9716, weight: 0.8 },
  { name: 'Barangay 7', lat: 14.6249, lng: 120.9722, weight: 0.9 },
  { name: 'Barangay 8', lat: 14.6261, lng: 120.9728, weight: 0.7 },
  { name: 'Barangay 9', lat: 14.6273, lng: 120.9734, weight: 1.0 },
  { name: 'Barangay 10', lat: 14.6285, lng: 120.9740, weight: 0.8 },
  { name: 'Barangay 11', lat: 14.6150, lng: 120.9678, weight: 0.9 },
  { name: 'Barangay 12', lat: 14.6162, lng: 120.9684, weight: 0.7 },
  { name: 'Barangay 13', lat: 14.6174, lng: 120.9690, weight: 0.8 },
  { name: 'Barangay 14', lat: 14.6186, lng: 120.9696, weight: 1.0 },
  { name: 'Barangay 15', lat: 14.6198, lng: 120.9702, weight: 0.6 },
  { name: 'Barangay 16', lat: 14.6210, lng: 120.9708, weight: 0.9 },
  { name: 'Barangay 17', lat: 14.6222, lng: 120.9714, weight: 0.7 },
  { name: 'Barangay 18', lat: 14.6234, lng: 120.9720, weight: 0.8 },
  { name: 'Barangay 19', lat: 14.6246, lng: 120.9726, weight: 1.0 },
  { name: 'Barangay 20', lat: 14.6258, lng: 120.9732, weight: 0.9 },
  { name: 'Barangay 21', lat: 14.6123, lng: 120.9670, weight: 0.8 },
  { name: 'Barangay 22', lat: 14.6135, lng: 120.9676, weight: 0.7 },
  { name: 'Barangay 23', lat: 14.6147, lng: 120.9682, weight: 0.9 },
  { name: 'Barangay 24', lat: 14.6159, lng: 120.9688, weight: 1.0 },
  { name: 'Barangay 25', lat: 14.6171, lng: 120.9694, weight: 0.6 },
  { name: 'Barangay 26', lat: 14.6183, lng: 120.9700, weight: 0.8 },
  { name: 'Barangay 27', lat: 14.6195, lng: 120.9706, weight: 0.7 },
  { name: 'Barangay 28', lat: 14.6207, lng: 120.9712, weight: 0.9 },
  { name: 'Barangay 29', lat: 14.6219, lng: 120.9718, weight: 1.0 },
  { name: 'Barangay 30', lat: 14.6231, lng: 120.9724, weight: 0.8 },
];

// Monthly dengue data based on NCR/Manila patterns
// Peak season: June-November in Philippines
const monthlyData = [
  { month: 1, year: 2024, baseCases: 30 },
  { month: 2, year: 2024, baseCases: 25 },
  { month: 3, year: 2024, baseCases: 20 },
  { month: 4, year: 2024, baseCases: 18 },
  { month: 5, year: 2024, baseCases: 35 },
  { month: 6, year: 2024, baseCases: 65 },
  { month: 7, year: 2024, baseCases: 85 },
  { month: 8, year: 2024, baseCases: 95 },
  { month: 9, year: 2024, baseCases: 90 },
  { month: 10, year: 2024, baseCases: 75 },
  { month: 11, year: 2024, baseCases: 55 },
  { month: 12, year: 2024, baseCases: 40 },
];

const seedDengueData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync();

    // Clear existing reports
    await Report.destroy({ where: {}, truncate: true, force: true });
    console.log('Cleared existing reports');

    const reports = [];

    for (const monthData of monthlyData) {
      for (const barangay of tondoBarangays) {
        // Calculate cases based on weight and month
        const cases = Math.round(monthData.baseCases * barangay.weight * (0.8 + Math.random() * 0.4));

        const date = new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 28) + 1);

        reports.push({
          location: barangay.name,
          cases: Math.max(1, cases),
          notes: `Dengue cases reported for ${barangay.name}, Tondo, Manila - ${date.toLocaleString('default', { month: 'long' })} ${monthData.year}`,
          latitude: barangay.lat,
          longitude: barangay.lng,
          createdAt: date,
          updatedAt: date
        });
      }
    }

    await Report.bulkCreate(reports);
    console.log(`✅ Successfully seeded ${reports.length} dengue reports!`);
    console.log(`📊 Covering ${tondoBarangays.length} barangays across ${monthlyData.length} months`);
    process.exit(0);

  } catch (error) {
    console.error('Seeder error:', error);
    process.exit(1);
  }
};

seedDengueData();
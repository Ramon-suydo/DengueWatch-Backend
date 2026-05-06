const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');

/**
 * @swagger
 * /api/prediction:
 *   get:
 *     summary: Get dengue risk prediction for a city
 *     tags: [Prediction]
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name (e.g. "MANILA CITY")
 *     responses:
 *       200:
 *         description: Risk prediction generated successfully
 */
router.get('/', predictionController.getPrediction);

/**
 * @swagger
 * /api/prediction/cities:
 *   get:
 *     summary: Get dengue risk predictions for all NCR cities
 *     tags: [Prediction]
 *     responses:
 *       200:
 *         description: All city risks fetched successfully
 */
router.get('/cities', predictionController.getAllCityRisks);

/**
 * @swagger
 * /api/prediction/provinces:
 *   get:
 *     summary: Get dengue risk predictions for all Philippine provinces
 *     tags: [Prediction]
 *     responses:
 *       200:
 *         description: All province risks fetched successfully
 */
router.get('/provinces', predictionController.getProvinceRisks);

/**
 * @swagger
 * /api/prediction/barangay:
 *   get:
 *     summary: Get dengue risk prediction for a specific barangay using Random Forest ML
 *     tags: [Prediction]
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name (e.g. "MANILA CITY")
 *       - in: query
 *         name: barangay
 *         required: true
 *         schema:
 *           type: string
 *         description: Barangay name
 *       - in: query
 *         name: district
 *         schema:
 *           type: string
 *         description: District name (optional)
 *     responses:
 *       200:
 *         description: Barangay risk prediction generated using Random Forest algorithm
 */
router.get('/barangay', predictionController.getBarangayRisk);

/**
 * @swagger
 * /api/prediction/district:
 *   get:
 *     summary: Get dengue risk prediction for a specific district using Random Forest ML
 *     tags: [Prediction]
 *     parameters:
 *       - in: query
 *         name: city
 *         required: true
 *         schema:
 *           type: string
 *         description: City name (e.g. "MANILA CITY")
 *       - in: query
 *         name: district
 *         required: true
 *         schema:
 *           type: string
 *         description: District name (e.g. "DISTRICT 1")
 *     responses:
 *       200:
 *         description: District risk prediction generated using Random Forest algorithm (aggregated from barangays)
 */
router.get('/district', predictionController.getDistrictRisk);

module.exports = router;
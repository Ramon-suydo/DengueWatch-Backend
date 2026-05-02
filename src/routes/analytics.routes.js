const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get overall summary statistics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Summary fetched successfully
 */
router.get('/summary', analyticsController.getSummary);

/**
 * @swagger
 * /api/analytics/by-location:
 *   get:
 *     summary: Get total cases grouped by location
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Cases by location fetched successfully
 */
router.get('/by-location', analyticsController.getCasesByLocation);

/**
 * @swagger
 * /api/analytics/over-time:
 *   get:
 *     summary: Get cases over time (monthly)
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Cases over time fetched successfully
 */
router.get('/over-time', analyticsController.getCasesOverTime);

/**
 * @swagger
 * /api/analytics/hotspots:
 *   get:
 *     summary: Get dengue hotspots
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *         description: Minimum cases to be considered a hotspot (default 10)
 *     responses:
 *       200:
 *         description: Hotspots fetched successfully
 */
router.get('/hotspots', analyticsController.getHotspots);

module.exports = router;
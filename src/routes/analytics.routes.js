const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/analytics/summary:
 *   get:
 *     summary: Get overall summary statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary fetched successfully
 */
router.get('/summary', authenticate, analyticsController.getSummary);

/**
 * @swagger
 * /api/analytics/by-location:
 *   get:
 *     summary: Get total cases grouped by location
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cases by location fetched successfully
 */
router.get('/by-location', authenticate, analyticsController.getCasesByLocation);

/**
 * @swagger
 * /api/analytics/over-time:
 *   get:
 *     summary: Get cases over time (monthly)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cases over time fetched successfully
 */
router.get('/over-time', authenticate, analyticsController.getCasesOverTime);

/**
 * @swagger
 * /api/analytics/hotspots:
 *   get:
 *     summary: Get dengue hotspots
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
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
router.get('/hotspots', authenticate, analyticsController.getHotspots);

module.exports = router;
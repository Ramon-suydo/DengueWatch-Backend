const express = require('express');
const router = express.Router();
const controller = require('../controllers/report.controller');
const { validateReport } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports with pagination and filters
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location
 *       - in: query
 *         name: minCases
 *         schema:
 *           type: integer
 *         description: Minimum cases
 *       - in: query
 *         name: maxCases
 *         schema:
 *           type: integer
 *         description: Maximum cases
 *     responses:
 *       200:
 *         description: Reports fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, controller.getAllReports);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Get a report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report fetched successfully
 *       404:
 *         description: Report not found
 */
router.get('/:id', authenticate, controller.getReportById);

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [location, cases]
 *             properties:
 *               location:
 *                 type: string
 *               cases:
 *                 type: integer
 *               notes:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Report created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, validateReport, controller.createReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   put:
 *     summary: Update a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report updated successfully
 *       404:
 *         description: Report not found
 */
router.put('/:id', authenticate, validateReport, controller.updateReport);

/**
 * @swagger
 * /api/reports/{id}:
 *   delete:
 *     summary: Soft delete a report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 */
router.delete('/:id', authenticate, controller.deleteReport);

module.exports = router;
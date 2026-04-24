const express = require('express');
const router = express.Router();

const controller = require('../controllers/report.controller');

router.get('/', controller.getAllReports);
router.get('/:id', controller.getReportById);
router.post('/', controller.createReport);
router.put('/:id', controller.updateReport);
router.delete('/:id', controller.deleteReport);

module.exports = router;
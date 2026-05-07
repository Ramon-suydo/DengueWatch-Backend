const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction.controller');

router.get('/', predictionController.getPrediction);
router.get('/cities', predictionController.getAllCityRisks);
router.get('/provinces', predictionController.getProvinceRisks);
router.get('/barangay', predictionController.getBarangayRisk);
router.get('/district', predictionController.getDistrictRisk);

module.exports = router;
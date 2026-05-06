const { predictRisk, predictAllCities, predictAllProvinces } = require('../services/riskPrediction.service');
const { predictBarangayRisk, predictDistrictRisk, initializeModel } = require('../services/districtBarangayPrediction.service');
const { sendSuccess, sendError } = require('../utils/response');

exports.getPrediction = async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) return sendError(res, 'City is required', 400);
        const prediction = await predictRisk(city);
        sendSuccess(res, prediction, 'Risk prediction generated successfully');
    } catch (error) {
        console.error('Prediction error:', error);
        sendError(res, 'Failed to generate prediction');
    }
};

exports.getAllCityRisks = async (req, res) => {
    try {
        const predictions = await predictAllCities();
        sendSuccess(res, predictions, 'All city risks fetched successfully');
    } catch (error) {
        console.error('Prediction error:', error);
        sendError(res, 'Failed to generate predictions');
    }
};

exports.getProvinceRisks = async (req, res) => {
    try {
        const predictions = await predictAllProvinces();
        sendSuccess(res, predictions, 'All province risks fetched successfully');
    } catch (error) {
        console.error('Province prediction error:', error);
        sendError(res, 'Failed to generate province predictions');
    }
};

exports.getBarangayRisk = async (req, res) => {
    try {
        const { city, barangay, district } = req.query;
        if (!city || !barangay) return sendError(res, 'City and Barangay are required', 400);
        
        // Initialize ML model on first request
        await initializeModel();
        
        const prediction = await predictBarangayRisk(city, barangay, district);
        sendSuccess(res, prediction, 'Barangay risk prediction generated successfully');
    } catch (error) {
        console.error('Barangay prediction error:', error);
        sendError(res, 'Failed to generate barangay prediction');
    }
};

exports.getDistrictRisk = async (req, res) => {
    try {
        const { city, district } = req.query;
        if (!city || !district) return sendError(res, 'City and District are required', 400);
        
        // Initialize ML model on first request
        await initializeModel();
        
        const prediction = await predictDistrictRisk(city, district);
        sendSuccess(res, prediction, 'District risk prediction generated successfully');
    } catch (error) {
        console.error('District prediction error:', error);
        sendError(res, 'Failed to generate district prediction');
    }
};
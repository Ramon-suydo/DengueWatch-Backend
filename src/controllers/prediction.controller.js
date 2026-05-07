const { predictRisk, predictAllCities } = require('../services/riskPrediction.service');
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
        const predictions = await predictAllCities();
        sendSuccess(res, predictions, 'Province predictions fetched successfully');
    } catch (error) {
        console.error('Province prediction error:', error);
        sendError(res, 'Failed to generate province predictions');
    }
};
exports.getBarangayRisk = async (req, res) => {
    try {
        const { city, barangay, district } = req.query;
        if (!city || !barangay) return sendError(res, 'City and barangay are required', 400);
        const prediction = await predictRisk(city);
        sendSuccess(res, { ...prediction, barangay, district }, 'Barangay risk prediction generated successfully');
    } catch (error) {
        console.error('Barangay prediction error:', error);
        sendError(res, 'Failed to generate barangay prediction');
    }
};

exports.getDistrictRisk = async (req, res) => {
    try {
        const { city, district } = req.query;
        if (!city || !district) return sendError(res, 'City and district are required', 400);
        const prediction = await predictRisk(city);
        sendSuccess(res, { ...prediction, district }, 'District risk prediction generated successfully');
    } catch (error) {
        console.error('District prediction error:', error);
        sendError(res, 'Failed to generate district prediction');
    }
};
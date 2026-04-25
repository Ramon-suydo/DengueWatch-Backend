const { Op, fn, col, literal } = require('sequelize');
const Report = require('../models/report.model');
const { sendSuccess, sendError } = require('../utils/response');

// Total cases per location
exports.getCasesByLocation = async (req, res) => {
    try {
        const data = await Report.findAll({
            attributes: [
                'location',
                [fn('SUM', col('cases')), 'totalCases'],
                [fn('COUNT', col('id')), 'reportCount']
            ],
            group: ['location'],
            order: [[literal('totalCases'), 'DESC']]
        });

        sendSuccess(res, data, 'Cases by location fetched successfully');
    } catch (error) {
        console.error('Analytics error:', error);
        sendError(res, 'Failed to fetch cases by location');
    }
};

// Cases over time (monthly)
exports.getCasesOverTime = async (req, res) => {
    try {
        const data = await Report.findAll({
            attributes: [
                [fn('YEAR', col('createdAt')), 'year'],
                [fn('MONTH', col('createdAt')), 'month'],
                [fn('SUM', col('cases')), 'totalCases'],
                [fn('COUNT', col('id')), 'reportCount']
            ],
            group: [
                fn('YEAR', col('createdAt')),
                fn('MONTH', col('createdAt'))
            ],
            order: [
                [fn('YEAR', col('createdAt')), 'ASC'],
                [fn('MONTH', col('createdAt')), 'ASC']
            ]
        });

        sendSuccess(res, data, 'Cases over time fetched successfully');
    } catch (error) {
        console.error('Analytics error:', error);
        sendError(res, 'Failed to fetch cases over time');
    }
};

// Hotspot detection (locations with most cases)
exports.getHotspots = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;

        const data = await Report.findAll({
            attributes: [
                'location',
                'latitude',
                'longitude',
                [fn('SUM', col('cases')), 'totalCases'],
                [fn('COUNT', col('id')), 'reportCount']
            ],
            group: ['location', 'latitude', 'longitude'],
            having: literal(`SUM(cases) >= ${Number(threshold)}`),
            order: [[literal('totalCases'), 'DESC']]
        });

        sendSuccess(res, data, 'Hotspots fetched successfully');
    } catch (error) {
        console.error('Analytics error:', error);
        sendError(res, 'Failed to fetch hotspots');
    }
};

// Summary statistics
exports.getSummary = async (req, res) => {
    try {
        const totalReports = await Report.count();
        const totalCases = await Report.sum('cases');
        const avgCases = await Report.findOne({
            attributes: [[fn('AVG', col('cases')), 'avgCases']]
        });
        const highestReport = await Report.findOne({
            order: [['cases', 'DESC']]
        });
        const latestReport = await Report.findOne({
            order: [['createdAt', 'DESC']]
        });

        sendSuccess(res, {
            totalReports,
            totalCases: totalCases || 0,
            averageCasesPerReport: Math.round(avgCases?.dataValues?.avgCases || 0),
            highestSingleReport: highestReport,
            latestReport
        }, 'Summary fetched successfully');
    } catch (error) {
        console.error('Analytics error:', error);
        sendError(res, 'Failed to fetch summary');
    }
};
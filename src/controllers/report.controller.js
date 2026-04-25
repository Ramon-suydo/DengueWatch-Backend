const { Op } = require('sequelize');
const Report = require('../models/report.model');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAllReports = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            location,
            minCases,
            maxCases,
            startDate,
            endDate,
            sortBy = 'createdAt',
            order = 'DESC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        // Filter by location
        if (location) {
            where.location = { [Op.like]: `%${location}%` };
        }

        // Filter by cases range
        if (minCases || maxCases) {
            where.cases = {};
            if (minCases) where.cases[Op.gte] = Number(minCases);
            if (maxCases) where.cases[Op.lte] = Number(maxCases);
        }

        // Filter by date range
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const validSortFields = ['createdAt', 'cases', 'location'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const { count, rows } = await Report.findAndCountAll({
            where,
            order: [[sortField, sortOrder]],
            limit: Number(limit),
            offset: Number(offset)
        });

        sendSuccess(res, {
            reports: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / limit)
            }
        }, 'Reports fetched successfully');

    } catch (error) {
        console.error('Error fetching reports:', error);
        sendError(res, 'Failed to fetch reports');
    }
};

exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return sendError(res, 'Report not found', 404);
        sendSuccess(res, report, 'Report fetched successfully');
    } catch (error) {
        console.error('Error fetching report:', error);
        sendError(res, 'Failed to fetch report');
    }
};

exports.createReport = async (req, res) => {
    try {
        const { location, cases, notes, latitude, longitude } = req.body;
        const newReport = await Report.create({ location, cases, notes, latitude, longitude });
        sendSuccess(res, newReport, 'Report created successfully', 201);
    } catch (error) {
        console.error('Error creating report:', error);
        sendError(res, 'Failed to create report');
    }
};

exports.updateReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return sendError(res, 'Report not found', 404);
        const { location, cases, notes, latitude, longitude } = req.body;
        await report.update({ location, cases, notes, latitude, longitude });
        sendSuccess(res, report, 'Report updated successfully');
    } catch (error) {
        console.error('Error updating report:', error);
        sendError(res, 'Failed to update report');
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);
        if (!report) return sendError(res, 'Report not found', 404);
        await report.destroy(); // soft delete — sets deletedAt instead of removing
        sendSuccess(res, null, 'Report deleted successfully');
    } catch (error) {
        console.error('Error deleting report:', error);
        sendError(res, 'Failed to delete report');
    }
};
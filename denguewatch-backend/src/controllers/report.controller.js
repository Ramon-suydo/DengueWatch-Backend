const Report = require('../models/report.model');

exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Failed to fetch reports' });
    }
};


exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.status(200).json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ message: 'Failed to fetch report' });
    }
};


exports.createReport = async (req, res) => {
    try {
        const { location, cases, notes, latitude, longitude } = req.body;

        // Basic validation
        if (!location || !cases) {
            return res.status(400).json({
                message: 'Location and cases are required'
            });
        }

        const newReport = await Report.create({
            location,
            cases,
            notes,
            latitude,
            longitude
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Failed to create report' });
    }
};


exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { location, cases, notes, latitude, longitude } = req.body;

        const report = await Report.findByPk(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        await report.update({
            location,
            cases,
            notes,
            latitude,
            longitude
        });

        res.status(200).json(report);
    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Failed to update report' });
    }
};


exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const report = await Report.findByPk(id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        await report.destroy();

        res.status(200).json({ message: 'Report deleted successfully' });
    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Failed to delete report' });
    }
};
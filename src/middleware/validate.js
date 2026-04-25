const validateReport = (req, res, next) => {
    const { location, cases } = req.body;

    const errors = [];

    if (!location || typeof location !== 'string' || location.trim() === '') {
        errors.push('Location is required and must be a string');
    }

    if (cases === undefined || cases === null) {
        errors.push('Cases is required');
    } else if (!Number.isInteger(Number(cases)) || Number(cases) < 0) {
        errors.push('Cases must be a non-negative integer');
    }

    if (req.body.latitude !== undefined && isNaN(Number(req.body.latitude))) {
        errors.push('Latitude must be a valid number');
    }

    if (req.body.longitude !== undefined && isNaN(Number(req.body.longitude))) {
        errors.push('Longitude must be a valid number');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

module.exports = { validateReport };
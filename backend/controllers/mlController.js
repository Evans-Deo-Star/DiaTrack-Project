// backend/controllers/mlController.js

const axios = require('axios');
const Reading = require('../models/Reading');
const ML_SERVICE_URL = 'https://diatrack-ml-service.onrender.com/predict_risk'; // ensure this is correct for your Flask app

// @desc    Get predictive hyperglycemia risk score
// @route   GET/POST /api/data/risk-score
// @access  Private
exports.getRiskScore = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ msg: 'Unauthorized: No user ID found.' });
        }

        // Fetch latest reading from DB
        const latestReading = await Reading.findOne({ user: userId })
                                           .sort({ readingDate: -1 })
                                           .lean();

        if (!latestReading) {
            return res.status(404).json({
                msg: 'No readings found for this user. Log at least one reading to get a risk score.'
            });
        }

        // Allow POST override (frontend can optionally send carbIntake/activity)
        // Priority: req.body fields -> latestReading fields -> sensible defaults
        const latestBloodSugar = req.body?.latest_blood_sugar ?? latestReading.bloodSugar;
        const carbFromReq = (req.body?.carb_intake !== undefined && req.body?.carb_intake !== null) ? Number(req.body.carb_intake) : null;
        const activityFromReq = (req.body?.activity !== undefined && req.body?.activity !== null) ? Number(req.body.activity) : null;

        const carbIntake = carbFromReq ?? latestReading.carbIntake ?? 60; // default 60g if none
        const activity = activityFromReq ?? latestReading.activity ?? 0;

        // Prepare ML input (send raw features; Flask side can compute derived features)
        const mlInput = {
            latest_blood_sugar: Number(latestBloodSugar),
            carb_intake: Number(carbIntake),
            activity: Number(activity)
        };

        console.log("-> Querying Python ML Service with:", mlInput);

        // Call Python ML service
        let mlResponse;
        try {
            mlResponse = await axios.post(ML_SERVICE_URL, mlInput, { timeout: 8000 });
        } catch (err) {
            console.error('ML Service call failed:', err.message);
            return res.status(500).json({
                success: false,
                msg: 'Failed to retrieve risk score. Make sure the Python ML service is running and reachable.',
                details: err.message
            });
        }

        const predictionData = mlResponse.data;

        if (!predictionData || !predictionData.success) {
            return res.status(500).json({
                success: false,
                msg: 'ML Service failed to return a prediction.',
                details: predictionData || 'No payload'
            });
        }

        // Send prediction to frontend and include the reading used for AI (ai_reading)
        res.status(200).json({
            success: true,
            risk_level: predictionData.risk_level,
            risk_probability: predictionData.risk_probability,
            recommendation: predictionData.recommendation,
            model_used: predictionData.model_used,
            ai_reading: mlInput.latest_blood_sugar,
            carb_intake: mlInput.carb_intake,
            activity: mlInput.activity,
            message: 'Prediction successful via Flask ML Service.'
        });

    } catch (error) {
        console.error("Unexpected error in getRiskScore:", error.message);
        res.status(500).json({
            success: false,
            msg: 'Internal server error while fetching risk score.',
            details: error.message
        });
    }
};

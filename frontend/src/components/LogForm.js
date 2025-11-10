import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // ✅ Use deployed backend URL

const READINGS_URL = `${BACKEND_URL}/api/readings`;


const LogForm = ({ onLogComplete, onBackClick, userId }) => {
    const [formData, setFormData] = useState({
        bloodSugar: '',
        unit: 'mg/dL',
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        dietNote: '',
        activityLog: '',
        mealType: '',          // e.g., Light / Moderate / High / Very High
        carbIntake: '',        // optional numeric (grams)
        activity: ''           // optional numeric (minutes)
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token;

        if (!token) {
            setError("Authentication token missing. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            };

            // Send all form data (backend handles defaults)
            const response = await axios.post(READINGS_URL, formData, config);

            if (response.data.success) {
                setSuccess('Reading saved successfully!');
                // Clear form (keep date/time defaults)
                setFormData({
                    ...formData,
                    bloodSugar: '',
                    dietNote: '',
                    activityLog: '',
                    carbIntake: '',
                    activity: '',
                    mealType: ''
                });

                setTimeout(() => {
                    if (onLogComplete) onLogComplete();
                }, 1000);
            }
        } catch (err) {
            console.error("Log Submission Error:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.msg ||
                'Server error during submission.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-8">
            <div className="p-4 md:p-8 w-full max-w-xl mx-auto bg-white shadow-xl rounded-lg">

                {/* Back Button */}
                <button
                    onClick={onBackClick}
                    className="text-gray-600 mb-4 flex items-center hover:text-gray-800 focus:outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Back to Dashboard
                </button>

                <h2 className="text-2xl font-semibold mb-6 text-gray-800">
                    Log New Reading
                </h2>

                {/* Alerts */}
                {error && <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-lg">{error}</div>}
                {success && <div className="mb-4 p-3 text-sm text-green-800 bg-green-100 rounded-lg">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Blood Sugar */}
                    <div>
                        <label htmlFor="bloodSugar" className="block text-sm font-bold text-gray-700 mb-1">
                            Blood Sugar Value*
                        </label>
                        <div className="flex space-x-2">
                            <input
                                id="bloodSugar"
                                name="bloodSugar"
                                type="number"
                                required
                                placeholder="e.g., 120"
                                value={formData.bloodSugar}
                                onChange={handleChange}
                                className="flex-grow px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
                            />
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                            >
                                <option value="mg/dL">mg/dL</option>
                                <option value="mmol/L">mmol/L</option>
                            </select>
                        </div>
                    </div>

                    {/* Date / Time */}
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                id="time"
                                name="time"
                                type="time"
                                value={formData.time}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Meal / Carb Intake */}
                    <h3 className="text-md font-semibold text-gray-600 pt-2 border-t mt-4">Meal & Carbohydrates</h3>

                    <div>
                        <label htmlFor="mealType" className="block text-sm font-medium text-gray-700 mb-1">
                            Meal Type
                        </label>
                        <select
                            id="mealType"
                            name="mealType"
                            value={formData.mealType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="">Select meal type</option>
                            <option value="Light">Light (≈30g carbs)</option>
                            <option value="Moderate">Moderate (≈60g carbs)</option>
                            <option value="High">High (≈90g carbs)</option>
                            <option value="Very High">Very High (≈120g carbs)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="carbIntake" className="block text-sm font-medium text-gray-700 mb-1">
                            Carb Intake (grams)
                        </label>
                        <input
                            id="carbIntake"
                            name="carbIntake"
                            type="number"
                            placeholder="Optional: enter exact grams"
                            value={formData.carbIntake}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">If left blank, meal type will estimate carbs.</p>
                    </div>

                    {/* Activity */}
                    <h3 className="text-md font-semibold text-gray-600 pt-2 border-t mt-4">Activity</h3>

                    <div>
                        <label htmlFor="activity" className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Duration (minutes)
                        </label>
                        <input
                            id="activity"
                            name="activity"
                            type="number"
                            placeholder="e.g., 30"
                            value={formData.activity}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Optional: numeric entry complements the notes below.</p>
                    </div>

                    {/* Notes */}
                    <h3 className="text-md font-semibold text-gray-600 pt-2 border-t mt-4">Notes</h3>

                    <div>
                        <label htmlFor="dietNote" className="block text-sm font-medium text-gray-700 mb-1">
                            Diet Note
                        </label>
                        <textarea
                            id="dietNote"
                            name="dietNote"
                            placeholder="e.g., Oatmeal and banana"
                            rows="2"
                            value={formData.dietNote}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="activityLog" className="block text-sm font-medium text-gray-700 mb-1">
                            Activity Log (Free text)
                        </label>
                        <textarea
                            id="activityLog"
                            name="activityLog"
                            placeholder="e.g., 30 minutes light jogging"
                            rows="2"
                            value={formData.activityLog}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Save Entry'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default LogForm;

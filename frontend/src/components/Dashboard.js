import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { BACKEND_URL } from '../config'; // ✅ Use deployed backend URL

// Recharts imports for graph
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// API Endpoints
const AI_URL = `${BACKEND_URL}/api/ai/predict`;
const READINGS_URL = `${BACKEND_URL}/api/readings`;

const Dashboard = ({ onLogClick, onLogout }) => {
    const [readings, setReadings] = useState([]);
    const [riskData, setRiskData] = useState({
        risk_level: 'Loading...',
        risk_probability: 0,
        recommendation: 'Fetching personalized advice...',
        ai_reading: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState('');
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const token = userInfo?.token;

        if (!token) {
            navigate('/');
            return;
        }

        if (userInfo?.name) {
            setName(userInfo.name);
        }

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        try {
            // 1️⃣ Fetch readings
            const readingsResponse = await axios.get(READINGS_URL, config);
            const userReadings = readingsResponse.data.data || [];
            setReadings(userReadings);

            // 2️⃣ Prepare latest reading (with optional carb intake)
            const latestReading = userReadings[0];
            if (!latestReading) {
                setError('No readings found. Log at least one to get predictions.');
                setIsLoading(false);
                return;
            }

            // 3️⃣ Call ML predictive API with POST (includes carbs if available)
            const mlPayload = {
                latest_blood_sugar: latestReading.bloodSugar,
                carb_intake: latestReading.carbIntake || 0 // safe default
            };

            const aiResponse = await axios.post(AI_URL, mlPayload, config);
            const aiData = aiResponse.data;

            if (aiData.success) {
                setRiskData(aiData);
            } else {
                setError(aiData.message || 'AI prediction failed.');
            }

        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            if (err.response && err.response.status === 401) {
                onLogout();
            } else {
                setError('Failed to load data. Ensure both Node.js and Python ML servers are running.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate, onLogout]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getRiskColor = (level) => {
        if (level === 'High') return "bg-red-100 border-red-400 text-red-800";
        if (level === 'Medium') return "bg-yellow-100 border-yellow-400 text-yellow-800";
        return "bg-green-100 border-green-400 text-green-800";
    };

    const latestReading = readings.length > 0 ? readings[0] : null;
    const aiReadingValue = riskData?.ai_reading || latestReading?.bloodSugar;

    // 7-Day Trend (Sticks + Area Graph)
    const renderTrendChart = () => {
        const chartData = readings.slice(0, 7).reverse();
        if (chartData.length === 0)
            return <p className="text-center text-gray-500 py-6">No data yet. Log your first reading!</p>;

        const maxReading = Math.max(...chartData.map(r => r.bloodSugar), 150);

        // Prepare data for the area graph
        const graphData = chartData.map(r => ({
            date: moment(r.readingDate).format('MMM D'),
            blood_sugar: r.bloodSugar
        }));

        return (
            <div className="p-4 bg-white rounded-lg border space-y-6">
                <h3 className="text-lg font-semibold mb-3">7-Day Trend</h3>

                {/* Stick Bars */}
                <div className="h-40 relative flex items-end justify-between px-2 pt-2">
                    {chartData.map((reading, index) => {
                        const height = (reading.bloodSugar / maxReading) * 100;
                        const barColor =
                            reading.bloodSugar === aiReadingValue ? 'bg-purple-500' :
                            reading.bloodSugar > 140 ? 'bg-red-500' : 'bg-blue-500';

                        return (
                            <div key={index} className="flex flex-col items-center w-1/7 h-full">
                                <div
                                    className={`w-2/3 rounded-t-full shadow-md transition-all duration-300 ${barColor}`}
                                    style={{ height: `${height}%` }}
                                    title={`Value: ${reading.bloodSugar}${reading.bloodSugar === aiReadingValue ? ' (Used for AI)' : ''}`}
                                ></div>
                                <span className="text-xs text-gray-500 mt-1">{reading.bloodSugar}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Area Graph */}
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBS" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="blood_sugar" stroke="#4f46e5" fillOpacity={1} fill="url(#colorBS)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Date Range */}
                <p className="text-center text-sm text-gray-500 mt-2">
                    {moment(chartData[0].readingDate).format('MMM D')} - {moment(chartData[chartData.length - 1].readingDate).format('MMM D')}
                </p>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 pt-8">
            <header className="flex justify-between items-center max-w-xl mx-auto mb-6">
                <h1 className="text-xl font-semibold">Hi, {name || 'User'}</h1>
                <button
                    onClick={onLogout}
                    className="text-gray-600 hover:text-red-500 focus:outline-none flex items-center space-x-1"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

            <main className="max-w-xl mx-auto space-y-6">
                {error && (
                    <div className="p-4 rounded-lg bg-red-100 text-red-800 border border-red-400">
                        <p className="font-semibold">Error:</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className={`p-4 rounded-lg shadow-md ${getRiskColor(riskData.risk_level)} border`}>
                    <h2 className="text-sm font-medium mb-1">Predictive Risk Level (Next 12h)</h2>
                    <p className="text-3xl font-bold">
                        {isLoading ? 'Calculating...' : riskData.risk_level}
                    </p>
                    {!isLoading && riskData.risk_probability > 0 && (
                        <p className="text-xs mt-1">
                            Probability: {(riskData.risk_probability * 100).toFixed(1)}%
                        </p>
                    )}
                    <div className="mt-3 pt-3 border-t border-opacity-30">
                        <p className="text-sm font-medium">Actionable Advice:</p>
                        <p className="text-sm font-normal mt-1">
                            {isLoading ? 'Loading advice...' : riskData.recommendation}
                        </p>
                    </div>
                </div>

                {renderTrendChart()}

                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-sm font-medium text-gray-700 mb-1">Latest Reading</h2>
                    {latestReading ? (
                        <p className="text-2xl font-semibold">
                            {latestReading.bloodSugar} {latestReading.unit} 
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                - {moment(latestReading.readingDate).fromNow()}
                                {latestReading.bloodSugar === aiReadingValue ? ' (Used for AI)' : ''}
                            </span>
                        </p>
                    ) : (
                        <p className="text-lg font-semibold text-gray-500">No readings logged yet.</p>
                    )}
                </div>
            </main>

            <button
                onClick={onLogClick}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition duration-150 ease-in-out"
                title="Log New Reading"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </button>
        </div>
    );
};

export default Dashboard;

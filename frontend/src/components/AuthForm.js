import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config'; // ✅ Import deployed backend URL

const API_BASE_URL = `${BACKEND_URL}/api/auth`;

const AuthForm = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // 👁️ toggle

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const url = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
        const submitData = isLogin ? { email, password } : { name, email, password };

        if (!email || !password || (!isLogin && !name)) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(url, submitData);
            if (response.data.token) {
                localStorage.setItem('userInfo', JSON.stringify(response.data));
                onAuthSuccess(response.data);
            }
        } catch (err) {
            console.error("Authentication Submission Error:", err);
            const errorMessage = err.response && err.response.data.message 
                                ? err.response.data.message 
                                : 'Server error: Check backend console for details.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 w-full max-w-md bg-white rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-6">DiaTrack</h2>

                {error && (
                    <div className="mb-4 p-3 text-sm text-red-800 bg-red-100 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    
                    <div className="relative">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"} // 👁️ toggle
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null);
                            setName('');
                        }}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                        {isLogin 
                            ? "Need an account? Sign Up" 
                            : "Already have an account? Log In"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;

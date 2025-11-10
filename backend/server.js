// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

// Import routes
const authRoutes = require('./routes/authRoutes');
const readingRoutes = require('./routes/readingRoutes');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

// ===============================
// Middleware
// ===============================
app.use(express.json());
app.use(cors());

// ===============================
// Environment Variables
// ===============================
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// ===============================
// Base Route
// ===============================
app.get('/', (req, res) => {
  res.send('✅ DiaTrack API is running successfully!');
});

// ===============================
// Connect to MongoDB
// ===============================
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connection established successfully!');

  // ===============================
  // Mount Routes (AFTER DB connects)
  // ===============================
  app.use('/api/auth', authRoutes);
  app.use('/api/readings', readingRoutes);
  app.use('/api/data', dataRoutes);

  // ===============================
  // AI Service Proxy
  // ===============================
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL;


app.post('/api/ai/predict', async (req, res) => {
  try {
    const response = await axios.post(ML_SERVICE_URL, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve AI score.' });
  }
});


  // ===============================
  // Start the Server
  // ===============================
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Access the API at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

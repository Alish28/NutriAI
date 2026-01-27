const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const mealRoutes = require('./routes/mealRoutes');
const profileRoutes = require('./routes/profileRoutes'); 

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/profile', profileRoutes);  

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'NutriAI Backend is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
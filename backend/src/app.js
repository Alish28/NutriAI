const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes       = require('./routes/authRoutes');
const mealRoutes       = require('./routes/mealRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const analyticsRoutes  = require('./routes/analyticsRoutes');
const aiRoutes         = require('./routes/aiRoutes');
const pantryRoutes     = require('./routes/pantryRoutes');
const homecookRoutes   = require('./routes/homecookRoutes');
const adminRoutes      = require('./routes/adminRoutes');
const recipeRoutes     = require('./routes/recipeRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const chatRoutes       = require('./routes/chatRoutes');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://nutri-ai-o4p4.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    let hostname = '';
    try {
      hostname = new URL(origin).hostname;
    } catch (error) {
      return callback(null, false);
    }

    const isAllowed =
      allowedOrigins.includes(origin) ||
      hostname.endsWith('.vercel.app');

    return callback(null, isAllowed);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',        authRoutes);
app.use('/api/meals',       mealRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/analytics',   analyticsRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/pantry',      pantryRoutes);
app.use('/api/homecook',    homecookRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/recipes',     recipeRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/chat',        chatRoutes);

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
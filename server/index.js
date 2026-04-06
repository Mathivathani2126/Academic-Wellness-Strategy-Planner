import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import strategyRoutes from './routes/strategy.js';
import emailRoutes from './routes/email.js';
import feedbackRoutes from './routes/feedback.js';
import User from './models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/strategies', strategyRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Database connection & Server Start
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/academic-wellness')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed admin user
    try {
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        const adminUser = new User({
          username: 'admin',
          email: 'admin@wellness.edu',
          password: 'admin123',
          role: 'admin'
        });
        await adminUser.save();
        console.log('Default admin seeded (username: admin, password: admin123)');
      }
    } catch (err) {
      console.error('Failed to seed admin', err);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });

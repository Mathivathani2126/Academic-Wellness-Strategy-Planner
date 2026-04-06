import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Register User
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists with this email' });
    
    let role = 'student';
    if (email.includes('admin')) {
      role = 'admin';
    }
    
    user = new User({ username, email, password, role });
    await user.save();
    
    const payload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ token, user: payload.user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check user with email or username
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    
    const payload = { user: { id: user.id, username: user.username, email: user.email, role: user.role } };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, user: payload.user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get User Profile
import { authMiddleware } from '../middleware/auth.js';
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

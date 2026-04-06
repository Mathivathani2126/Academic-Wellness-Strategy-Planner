import express from 'express';
import Feedback from '../models/Feedback.js';
import { authMiddleware, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/feedback
// @desc    Submit new feedback (Students)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, type, message, rating } = req.body;
    
    const newFeedback = new Feedback({
      user_id: req.user.id,
      name,
      email,
      type,
      message,
      rating
    });

    await newFeedback.save();
    res.status(201).json(newFeedback);
  } catch (error) {
    console.error('Feedback creation error:', error);
    res.status(500).json({ error: 'Server error while submitting feedback' });
  }
});

// @route   GET /api/feedback
// @desc    Get all feedback (Admin)
router.get('/', adminAuth, async (req, res) => {
  try {
    const feedbackList = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbackList);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching feedback' });
  }
});

// @route   GET /api/feedback/summary
// @desc    Get feedback analytics summary (Admin)
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const pendingCount = await Feedback.countDocuments({ status: 'Pending' });
    const resolvedCount = await Feedback.countDocuments({ status: 'Resolved' });
    
    // Most common type
    const typeAggr = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const mostCommonType = typeAggr.length > 0 ? typeAggr[0]._id : 'N/A';

    // Average rating
    const ratingAggr = await Feedback.aggregate([
      { $match: { rating: { $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const averageRating = ratingAggr.length > 0 ? ratingAggr[0].avgRating.toFixed(1) : 0;

    res.json({
      totalFeedback,
      pendingCount,
      resolvedCount,
      mostCommonType,
      averageRating
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while calculating summary' });
  }
});

// @route   GET /api/feedback/:id
// @desc    Get single feedback details (Admin)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('user_id', 'username email role profile');
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching feedback' });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Update feedback status and reply (Admin)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { status, reply } = req.body;
    let updateFields = {};
    if (status) updateFields.status = status;
    if (reply !== undefined) updateFields.reply = reply;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id, 
      { $set: updateFields },
      { new: true }
    );
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Server error while updating feedback' });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Delete feedback (Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) return res.status(404).json({ error: 'Feedback not found' });
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting feedback' });
  }
});

export default router;

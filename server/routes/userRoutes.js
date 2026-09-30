const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect } = require('../middleware/authMiddleware');
const { enrichUser, freelancerStats } = require('../utils/stats');
const { initials } = require('../utils/helpers');

const router = express.Router();

const PATCHABLE = [
  'headline',
  'location',
  'timezone',
  'bio',
  'rate',
  'availability',
  'hoursPerWeek',
  'skills',
  'languages',
  'education',
  'certifications',
  'links',
  'portfolio',
  'company',
  'industry',
  'companySize',
  'website',
  'founded',
  'budgetRange',
  'engagement',
  'categories',
  'payment',
  'team',
  'responseTime',
  'onTime',
  'repeatClients',
];

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: await enrichUser(user) });
  } catch (err) {
    next(err);
  }
});

router.patch('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const body = req.body || {};
    PATCHABLE.forEach((key) => {
      if (key in body) user[key] = body[key];
    });
    await user.save();
    res.json({ user: await enrichUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name role company')
      .sort({ createdAt: -1 })
      .limit(10);
    const stats = user.role === 'freelancer' ? await freelancerStats(user._id) : {};
    res.json({
      user: { ...user.toObject(), id: String(user._id), stats },
      reviews: reviews.map((r) => ({
        id: r._id,
        name: r.reviewer ? r.reviewer.name : 'Anonymous',
        role: r.role,
        rating: r.rating,
        text: r.text,
        initials: initials(r.reviewer ? r.reviewer.name : 'A'),
        at: r.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

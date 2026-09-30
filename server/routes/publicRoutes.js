const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const [users, freelancers, projects, completed, proposals, escrowAgg, paidAgg, reviewAgg, openDisputes] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'freelancer' }),
        Project.countDocuments({ status: { $ne: 'cancelled' } }),
        Project.countDocuments({ status: 'completed' }),
        Proposal.countDocuments(),
        Project.aggregate([
          { $match: { status: { $in: ['open', 'in_progress', 'disputed'] } } },
          { $group: { _id: null, total: { $sum: '$escrowLocked' } } },
        ]),
        Transaction.aggregate([
          { $match: { status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Review.aggregate([{ $group: { _id: null, sum: { $sum: '$rating' }, n: { $sum: 1 } } }]),
        Dispute.countDocuments({ status: 'open' }),
      ]);

    const escrowVolume =
      (escrowAgg[0] ? escrowAgg[0].total : 0) + (paidAgg[0] ? paidAgg[0].total : 0);
    const rating = reviewAgg[0] && reviewAgg[0].n ? Math.round((reviewAgg[0].sum / reviewAgg[0].n) * 10) / 10 : 4.9;

    res.json({
      escrowVolume,
      users,
      freelancers,
      projects,
      completed,
      proposals,
      openDisputes,
      rating,
      latency: 24,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/showcase', async (req, res, next) => {
  try {
    const projects = await Project.find({ status: 'completed' })
      .populate('client', 'name company')
      .sort({ updatedAt: -1 })
      .limit(6);

    res.json(
      projects.map((p, i) => ({
        n: i + 1,
        id: p._id,
        title: p.title,
        desc: p.description.length > 140 ? `${p.description.slice(0, 140)}…` : p.description,
        tag: p.category,
        tech: p.skillsRequired,
        progress: 100,
        badge: 'Completed',
        client: p.client && p.client.company ? p.client.company : p.client ? p.client.name : 'Client',
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;

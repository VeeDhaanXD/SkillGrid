const express = require('express');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { freelancerStats, clientStats } = require('../utils/stats');
const { shortTime, fmtDate, projectStatusLabel } = require('../utils/helpers');

const router = express.Router();

const TASK_COLORS = ['bg-emerald-400', 'bg-sky-400', 'bg-amber-400', 'bg-violet-400', 'bg-rose-400'];

async function feedFor(userId, limit = 6) {
  const items = await Activity.find({ users: userId }).sort({ at: -1 }).limit(limit);
  return items.map((a) => ({ t: shortTime(a.at), text: a.text, tone: a.tone }));
}

router.get('/freelancer', protect, authorizeRoles('freelancer'), async (req, res, next) => {
  try {
    const uid = req.user._id;
    const stats = await freelancerStats(uid);

    const [openProjects, myProjects] = await Promise.all([
      Project.find({ status: 'open' })
        .populate('client', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      Project.find({ assignedFreelancer: uid, status: { $in: ['in_progress', 'disputed'] } })
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    const inflow = new Array(12).fill(0);
    const txs = await Transaction.find({ user: uid, direction: 'in', status: 'paid' });
    const now = new Date();
    txs.forEach((t) => {
      const d = new Date(t.date);
      const idx = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (idx >= 0 && idx < 12) inflow[idx] += t.amount;
    });

    res.json({
      stats: {
        rating: stats.rating,
        jobs: stats.jobs,
        success: stats.success,
        earned: stats.earned,
        activeBids: stats.activeBids,
        onTime: stats.onTime,
        responseTime: stats.responseTime,
        sparks: stats.sparks,
        chart: { inflow },
      },
      jobs: openProjects.map((p) => ({
        id: p._id,
        title: p.title,
        tag: p.category,
        budget: p.budget,
        client: p.client ? p.client.name : 'Client',
        time: shortTime(p.createdAt),
        bids: p.proposalCount,
        duration: p.duration,
        skills: p.skillsRequired,
      })),
      tasks: myProjects.map((p, i) => ({
        id: p._id,
        title: p.title,
        progress: p.progress || 0,
        due: fmtDate(p.dueDate),
        color: TASK_COLORS[i % TASK_COLORS.length],
        status: p.status,
      })),
      feed: await feedFor(uid),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/client', protect, authorizeRoles('client'), async (req, res, next) => {
  try {
    const uid = req.user._id;
    const stats = await clientStats(uid);

    const projects = await Project.find({ client: uid }).sort({ createdAt: -1 }).limit(4);

    const allProjects = await Project.find({ client: uid }).select('_id');
    const ids = allProjects.map((p) => p._id);
    const pendingProposals = await Proposal.countDocuments({ project: { $in: ids }, status: 'pending' });

    res.json({
      stats: {
        active: stats.active,
        hireRate: stats.hireRate,
        proposals: stats.proposals,
        posted: stats.posted,
        spent: stats.spent,
        avgBudget: stats.avgBudget,
        rating: stats.rating,
        repeat: stats.repeat,
        sparks: stats.sparks,
        chart: { spend: stats.monthlySpend },
      },
      pendingProposals,
      escrow: stats.escrow,
      projects: projects.map((p) => ({
        id: p._id,
        title: p.title,
        budget: p.budget,
        proposals: p.proposalCount,
        status: p.statusLabel || projectStatusLabel(p),
        statusRaw: p.status,
        progress: p.progress,
        freelancer: p.assignedFreelancer ? 'Assigned' : 'Unassigned',
        due: fmtDate(p.dueDate),
      })),
      feed: await feedFor(uid),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/admin', protect, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const [users, projects, openDisputes, escrowAgg, paidAgg, proposals] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Dispute.countDocuments({ status: 'open' }),
      Project.aggregate([
        { $match: { status: { $in: ['open', 'in_progress', 'disputed'] } } },
        { $group: { _id: null, total: { $sum: '$escrowLocked' } } },
      ]),
      Transaction.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Proposal.countDocuments(),
    ]);

    const escrowVolume = (escrowAgg[0] ? escrowAgg[0].total : 0) + (paidAgg[0] ? paidAgg[0].total : 0);

    const disputes = await Dispute.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: 'project', select: 'title client assignedFreelancer' })
      .populate({ path: 'initiatedBy', select: 'name role' });

    res.json({
      stats: {
        users,
        projects,
        openDisputes,
        escrowVolume,
        proposals,
        completed: await Project.countDocuments({ status: 'completed' }),
      },
      disputes: disputes.map((d) => ({
        id: d.project && d.project.title ? `DSP-${String(d._id).slice(-4).toUpperCase()}` : 'DSP-0000',
        dbId: d._id,
        project: d.project ? d.project.title : 'Project',
        reason: d.reason,
        amount: d.amountDisputed,
        status: d.status,
        initiatedBy: d.initiatedBy ? d.initiatedBy.name : 'User',
        createdAt: d.createdAt,
        time: shortTime(d.createdAt),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const Transaction = require('../models/Transaction');
const Project = require('../models/Project');
const User = require('../models/User');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { freelancerStats } = require('../utils/stats');
const { logActivity, notify, fmtDate } = require('../utils/helpers');

const router = express.Router();

function monthIndex(date) {
  const now = new Date();
  const d = new Date(date);
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

router.get('/', protect, authorizeRoles('freelancer'), async (req, res, next) => {
  try {
    const uid = req.user._id;
    const stats = await freelancerStats(uid);

    const txs = await Transaction.find({ user: uid }).sort({ date: -1 }).limit(60).populate('project', 'title');

    const inflow = new Array(12).fill(0);
    const outflow = new Array(12).fill(0);
    const all = await Transaction.find({ user: uid });
    all.forEach((t) => {
      const idx = monthIndex(t.date);
      if (idx >= 0 && idx < 12) {
        if (t.direction === 'in' && t.status === 'paid') inflow[idx] += t.amount;
        if (t.direction === 'out') outflow[idx] += t.amount;
      }
    });

    const active = await Project.find({ assignedFreelancer: uid, status: 'in_progress' })
      .sort({ dueDate: 1 })
      .limit(1);

    let next = null;
    if (active.length) {
      const p = active[0];
      const pct = p.progress || 0;
      next = {
        label: p.title,
        amount: Math.max(1, Math.round((p.escrowLocked || p.budget) * (pct > 0 ? pct / 100 : 0.25))),
        due: p.dueDate,
        pct,
      };
    }

    res.json({
      stats: {
        earned: stats.earned,
        pending: stats.pending,
        available: stats.available,
        rating: stats.rating,
        jobs: stats.jobs,
        success: stats.success,
        activeBids: stats.activeBids,
        onTime: stats.onTime,
        responseTime: stats.responseTime,
        monthlyEarn: stats.monthlyEarn,
        sparks: stats.sparks,
        next,
      },
      transactions: txs.map((t) => ({
        id: t._id,
        title: t.title,
        client: t.party || 'Client',
        amount: t.amount,
        direction: t.direction,
        status: t.status === 'paid' ? 'Paid' : 'Pending',
        date: fmtDate(t.date),
        method: t.method,
      })),
      chart: { inflow, outflow },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/withdraw', protect, authorizeRoles('freelancer'), async (req, res, next) => {
  try {
    const amount = Number((req.body || {}).amount);
    if (!amount || amount <= 0) return res.status(400).json({ message: 'A valid amount is required' });

    const user = await User.findById(req.user._id);
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient available balance' });
    }

    user.balance -= amount;
    await user.save();

    await Transaction.create({
      user: user._id,
      title: 'Payout to bank account',
      party: 'SkillGrid',
      type: 'withdrawal',
      method: 'Bank transfer',
      amount,
      direction: 'out',
      status: 'pending',
      date: new Date(),
    });

    await notify(user._id, `Withdrawal of $${amount} initiated — expect funds in 1–2 business days`, 'payment');
    await logActivity([user._id], `Withdrew $${amount} from available balance`, 'sky');

    res.json({ ok: true, balance: user.balance });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

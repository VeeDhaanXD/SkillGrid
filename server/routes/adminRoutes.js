const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { logActivity, notify, shortTime, projectStatusLabel, initials } = require('../utils/helpers');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

/* ---------- users ---------- */
router.get('/users', async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};
    if (role && role !== 'All') filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('name email role status createdAt').sort({ createdAt: -1 });
    const projects = await Project.find().select('client assignedFreelancer');
    const counts = new Map();
    projects.forEach((p) => {
      if (p.client) counts.set(String(p.client), (counts.get(String(p.client)) || 0) + 1);
      if (p.assignedFreelancer) {
        counts.set(String(p.assignedFreelancer), (counts.get(String(p.assignedFreelancer)) || 0) + 1);
      }
    });

    res.json(
      users.map((u) => ({
        id: `USR-${String(u._id).slice(-4).toUpperCase()}`,
        dbId: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status === 'suspended' ? 'Suspended' : 'Active',
        projects: counts.get(String(u._id)) || 0,
        joined: shortTime(u.createdAt),
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'status must be active or suspended' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin accounts cannot be suspended' });

    user.status = status;
    await user.save();

    await notify(
      user._id,
      status === 'suspended' ? 'Your account has been suspended by an administrator' : 'Your account has been reactivated',
      'system'
    );
    res.json({ ok: true, status });
  } catch (err) {
    next(err);
  }
});

/* ---------- project moderation ---------- */
router.get('/projects', async (req, res, next) => {
  try {
    const { flagged } = req.query;
    const filter = flagged === '1' ? { flagged: true } : {};
    const projects = await Project.find(filter)
      .populate('client', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(
      projects.map((p) => ({
        id: `PRJ-${String(p._id).slice(-4).toUpperCase()}`,
        dbId: p._id,
        title: p.title,
        client: p.client ? p.client.name : 'Client',
        reason: p.flagReason || 'Reported by users',
        status: p.flagged ? (p.status === 'open' ? 'Flagged' : 'Under Review') : projectStatusLabel(p),
        rawStatus: p.status,
        budget: p.budget,
        flagged: p.flagged,
        time: shortTime(p.createdAt),
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.patch('/projects/:id', async (req, res, next) => {
  try {
    const { action, reason } = req.body || {};
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    if (action === 'flag') {
      p.flagged = true;
      p.flagReason = reason || 'Flagged by moderator';
      await p.save();
      await notify(p.client, `Your project "${p.title}" was flagged for review`, 'alert');
      return res.json({ ok: true, action });
    }

    if (action === 'approve') {
      p.flagged = false;
      p.flagReason = '';
      await p.save();
      await notify(p.client, `Your project "${p.title}" has been approved and is visible again`, 'project');
      return res.json({ ok: true, action });
    }

    if (action === 'remove') {
      if (p.status === 'in_progress') {
        return res.status(400).json({ message: 'Active projects must be resolved through disputes, not removed' });
      }
      await Proposal.deleteMany({ project: p._id });
      await Transaction.deleteMany({ project: p._id });
      await Dispute.deleteMany({ project: p._id });
      await logActivity([p.client], `Project "${p.title}" was removed by moderation`, 'rose');
      await p.deleteOne();
      return res.json({ ok: true, action });
    }

    res.status(400).json({ message: 'Unknown action' });
  } catch (err) {
    next(err);
  }
});

/* ---------- disputes ---------- */
router.get('/disputes', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const disputes = await Dispute.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: 'project', select: 'title status client assignedFreelancer' })
      .populate('initiatedBy', 'name role');

    const rows = await Promise.all(
      disputes.map(async (d) => {
        const project = d.project;
        let clientName = 'Client';
        let devName = 'Unassigned';
        if (project) {
          const [client, dev] = await Promise.all([
            User.findById(project.client).select('name'),
            project.assignedFreelancer ? User.findById(project.assignedFreelancer).select('name') : null,
          ]);
          clientName = client ? client.name : 'Client';
          devName = dev ? dev.name : 'Unassigned';
        }
        return {
          id: `DSP-${String(d._id).slice(-4).toUpperCase()}`,
          dbId: d._id,
          project: project ? project.title : 'Project',
          client: clientName,
          dev: devName,
          amount: d.amountDisputed,
          reason: d.reason,
          status: d.status,
          initiatedBy: d.initiatedBy ? `${d.initiatedBy.name} (${d.initiatedBy.role})` : 'User',
          notes: d.adminNotes,
          time: shortTime(d.createdAt),
        };
      })
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/disputes/:id/resolve', async (req, res, next) => {
  try {
    const { resolution, notes } = req.body || {};
    if (!['refund', 'release'].includes(resolution)) {
      return res.status(400).json({ message: 'resolution must be refund or release' });
    }
    const dispute = await Dispute.findById(req.params.id).populate('project');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    if (dispute.status !== 'open') return res.status(400).json({ message: 'Dispute already resolved' });

    const project = dispute.project;
    const amount = dispute.amountDisputed;

    dispute.status = resolution === 'refund' ? 'resolved_client_refund' : 'resolved_dev_release';
    dispute.resolution = resolution;
    dispute.adminNotes = notes || '';
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    if (project) {
      if (resolution === 'refund') {
        project.status = 'cancelled';
        if (project.client) await User.updateOne({ _id: project.client }, { $inc: { escrowBalance: -amount } });
        await Transaction.updateOne(
          { project: project._id, direction: 'in', status: 'pending' },
          { $set: { status: 'cancelled' } }
        );
      } else {
        project.status = 'completed';
        project.progress = 100;
        if (project.assignedFreelancer) {
          await User.updateOne({ _id: project.assignedFreelancer }, { $inc: { balance: amount } });
          await Transaction.updateOne(
            { project: project._id, direction: 'in', status: 'pending' },
            { $set: { status: 'paid', date: new Date() } }
          );
        }
        if (project.client) await User.updateOne({ _id: project.client }, { $inc: { escrowBalance: -amount } });
      }
      await project.save();

      const parties = [project.client, project.assignedFreelancer].filter(Boolean);
      const msg =
        resolution === 'refund'
          ? `Dispute resolved — $${amount} refunded from "${project.title}"`
          : `Dispute resolved — $${amount} released to the developer for "${project.title}"`;
      await logActivity(parties, msg, resolution === 'refund' ? 'sky' : 'emerald');
      for (const uid of parties) {
        await notify(uid, msg, 'alert');
      }
    }

    res.json({ ok: true, status: dispute.status });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

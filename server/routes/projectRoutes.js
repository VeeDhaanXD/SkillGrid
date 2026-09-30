const express = require('express');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Transaction = require('../models/Transaction');
const Dispute = require('../models/Dispute');
const User = require('../models/User');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { logActivity, notify, shortTime, fmtDate, computeMatch, projectStatusLabel, initials } = require('../utils/helpers');

const router = express.Router();

const DURATION_DAYS = {
  '1 week': 7,
  '2 weeks': 14,
  '1 month': 30,
  '2 months': 60,
};

function parseDuration(str) {
  if (DURATION_DAYS[str]) return DURATION_DAYS[str];
  const m = String(str || '').match(/(\d+)\s*(day|week|month)/i);
  if (!m) return 14;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  return unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
}

function jobLevel(budget) {
  if (budget >= 3000) return 'Expert';
  if (budget >= 1000) return 'Senior';
  return 'Intermediate';
}

router.get('/', protect, async (req, res, next) => {
  try {
    const { mine, assigned, status, category, q, limit } = req.query;
    const filter = {};

    if (mine === '1') filter.client = req.user._id;
    else if (assigned === '1') filter.assignedFreelancer = req.user._id;
    else filter.flagged = { $ne: true };
    if (status) filter.status = status;
    else if (mine !== '1' && assigned !== '1') filter.status = { $in: ['open', 'in_progress', 'completed', 'disputed'] };
    if (category && category !== 'All') filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { skillsRequired: { $regex: q, $options: 'i' } },
      ];
    }

    let query = Project.find(filter)
      .populate('client', 'name company rating')
      .populate('assignedFreelancer', 'name')
      .sort({ createdAt: -1 });
    if (limit) query = query.limit(parseInt(limit, 10));

    const projects = await query;

    res.json(
      projects.map((p) => ({
        id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        tag: p.category,
        budget: p.budget,
        escrowLocked: p.escrowLocked,
        client: p.client ? p.client.name : 'Client',
        clientCompany: p.client ? p.client.company || '' : '',
        freelancer: p.assignedFreelancer ? p.assignedFreelancer.name : 'Unassigned',
        freelancerId: p.assignedFreelancer ? String(p.assignedFreelancer._id) : null,
        status: p.status,
        statusLabel: projectStatusLabel(p),
        progress: p.progress,
        proposals: p.proposalCount,
        bids: p.proposalCount,
        duration: p.duration,
        level: jobLevel(p.budget),
        skills: p.skillsRequired,
        dueDate: p.dueDate,
        due: fmtDate(p.dueDate),
        time: shortTime(p.createdAt),
        flagged: p.flagged,
        createdAt: p.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, authorizeRoles('client'), async (req, res, next) => {
  try {
    const { title, description, budget, duration, category, skills } = req.body || {};
    if (!title || !description || !budget) {
      return res.status(400).json({ message: 'title, description and budget are required' });
    }
    if (Number(budget) <= 0) return res.status(400).json({ message: 'Budget must be positive' });

    const deadlineDays = parseDuration(duration);
    const tags = Array.isArray(skills)
      ? skills
      : String(skills || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    const project = await Project.create({
      title,
      description,
      budget: Number(budget),
      duration: duration || '2 weeks',
      deadlineDays,
      dueDate: new Date(Date.now() + deadlineDays * 864e5),
      category: category || 'Full Stack',
      skillsRequired: tags,
      client: req.user._id,
      status: 'open',
      progress: 0,
    });

    await logActivity([req.user._id], `Posted "${project.title}" to the marketplace`, 'emerald');
    await notify(req.user._id, `Project "${project.title}" is live — matching freelancers now`, 'project');

    const created = await Project.findById(project._id)
      .populate('client', 'name company')
      .populate('assignedFreelancer', 'name');
    res.status(201).json({ project: { ...mapProject(created), id: String(created._id) } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id)
      .populate('client', 'name company rating')
      .populate('assignedFreelancer', 'name');
    if (!p) return res.status(404).json({ message: 'Project not found' });
    res.json({ project: { ...mapProject(p), id: String(p._id), description: p.description } });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', protect, async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    const isOwner = p.client && p.client.equals(req.user._id);
    const isAssigned = p.assignedFreelancer && p.assignedFreelancer.equals(req.user._id);
    if (!isOwner && !isAssigned) return res.status(403).json({ message: 'Not your project' });

    const { delta, status, progress } = req.body || {};

    if (typeof delta === 'number' || typeof progress === 'number') {
      if (!isOwner) return res.status(403).json({ message: 'Only the client can advance progress' });
      const nextVal = Math.max(0, Math.min(100, (p.progress || 0) + (delta || progress)));
      p.progress = nextVal;

      if (nextVal >= 100 && p.status === 'in_progress') {
        await completeProject(p);
      } else if (p.status === 'open' && nextVal > 0 && p.assignedFreelancer) {
        p.status = 'in_progress';
      }
    }

    if (status === 'cancelled' && isOwner && p.status === 'open') {
      p.status = 'cancelled';
      await logActivity([p.client], `Cancelled "${p.title}"`, 'rose');
      await notify(p.client, `Project "${p.title}" was cancelled`, 'project');
    }

    await p.save();
    const fresh = await Project.findById(p._id).populate('assignedFreelancer', 'name').populate('client', 'name');
    res.json({ project: mapProject(fresh) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    if (!p.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your project' });
    }
    if (p.status === 'in_progress') {
      return res.status(400).json({ message: 'Active projects cannot be deleted — cancel or complete them first' });
    }
    await Proposal.deleteMany({ project: p._id });
    await p.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ---------------- proposals on a project ---------------- */

router.get('/:id/proposals', protect, async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    if (!p.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the project owner can view proposals' });
    }

    const proposals = await Proposal.find({ project: p._id })
      .populate('freelancer', 'name headline skills rating role')
      .sort({ createdAt: -1 });

    const freelancerIds = proposals.map((pr) => pr.freelancer && pr.freelancer._id).filter(Boolean);
    const jobCounts = await Proposal.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'project',
          foreignField: '_id',
          as: 'proj',
        },
      },
      { $unwind: '$proj' },
      { $match: { status: 'completed', freelancer: { $in: freelancerIds } } },
      { $group: { _id: '$freelancer', n: { $sum: 1 } } },
    ]);
    const jobsMap = new Map(jobCounts.map((j) => [String(j._id), j.n]));

    res.json(
      proposals.map((pr) => {
        const f = pr.freelancer;
        return {
          id: pr._id,
          project: p.title,
          projectId: String(p._id),
          freelancer: f ? f.name : 'Freelancer',
          freelancerId: f ? String(f._id) : null,
          initials: initials(f ? f.name : 'F'),
          bid: pr.amount,
          rating: f ? f.rating : 5,
          jobs: f ? jobsMap.get(String(f._id)) || 0 : 0,
          match: pr.match,
          eta: `${pr.deliveryDays}d`,
          deliveryDays: pr.deliveryDays,
          summary: pr.coverLetter,
          skills: f && f.skills ? f.skills.map((s) => s.name) : pr.skills,
          status: pr.status,
          createdAt: pr.createdAt,
          time: shortTime(pr.createdAt),
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

router.post('/:id/proposals', protect, authorizeRoles('freelancer'), async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    if (p.status !== 'open') return res.status(400).json({ message: 'This project is no longer open for bids' });
    if (p.client.equals(req.user._id)) return res.status(400).json({ message: 'You cannot bid on your own project' });

    const { amount, deliveryDays, coverLetter } = req.body || {};
    if (!amount || !deliveryDays) {
      return res.status(400).json({ message: 'amount and deliveryDays are required' });
    }

    const existing = await Proposal.findOne({ project: p._id, freelancer: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already submitted a proposal for this project' });

    const userSkills = (req.user.skills || []).map((s) => s.name || s);
    const match = computeMatch(p.skillsRequired, userSkills);

    const proposal = await Proposal.create({
      project: p._id,
      freelancer: req.user._id,
      amount: Number(amount),
      deliveryDays: Number(deliveryDays),
      coverLetter: coverLetter || '',
      skills: userSkills.slice(0, 4),
      match,
      status: 'pending',
    });

    p.proposalCount += 1;
    await p.save();

    await notify(p.client, `${req.user.name} submitted a bid on "${p.title}"`, 'proposal');
    await logActivity([p.client, req.user._id], `${req.user.name} bid $${Number(amount)} on "${p.title}"`, 'sky');

    res.status(201).json({ proposal: { id: proposal._id, match, status: proposal.status } });
  } catch (err) {
    next(err);
  }
});

/* ---------------- dispute ---------------- */

router.post('/:id/dispute', protect, async (req, res, next) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    const isOwner = p.client.equals(req.user._id);
    const isAssigned = p.assignedFreelancer && p.assignedFreelancer.equals(req.user._id);
    if (!isOwner && !isAssigned) return res.status(403).json({ message: 'Not a participant on this project' });
    if (p.status !== 'in_progress') return res.status(400).json({ message: 'Only active projects can be disputed' });

    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ message: 'A reason is required' });

    const dispute = await Dispute.create({
      project: p._id,
      initiatedBy: req.user._id,
      reason,
      amountDisputed: p.escrowLocked || p.budget,
      status: 'open',
    });

    p.status = 'disputed';
    await p.save();

    const other = isOwner ? p.assignedFreelancer : p.client;
    await notify(other, `A dispute was opened on "${p.title}"`, 'alert');
    await notify(req.user._id, `Dispute opened — our team will review it shortly`, 'alert');
    await logActivity([p.client, p.assignedFreelancer].filter(Boolean), `Dispute opened on "${p.title}"`, 'rose');

    res.status(201).json({ dispute: { id: dispute._id, status: dispute.status } });
  } catch (err) {
    next(err);
  }
});

/* ---------------- helpers ---------------- */

function mapProject(p) {
  return {
    id: p._id,
    title: p.title,
    description: p.description,
    category: p.category,
    tag: p.category,
    budget: p.budget,
    escrowLocked: p.escrowLocked,
    client: p.client && p.client.name ? p.client.name : String(p.client || ''),
    clientCompany: p.client && p.client.company ? p.client.company : '',
    freelancer: p.assignedFreelancer && p.assignedFreelancer.name ? p.assignedFreelancer.name : 'Unassigned',
    freelancerId: p.assignedFreelancer ? String(p.assignedFreelancer._id) : null,
    status: p.status,
    statusLabel: projectStatusLabel(p),
    progress: p.progress,
    proposals: p.proposalCount,
    bids: p.proposalCount,
    duration: p.duration,
    skills: p.skillsRequired,
    dueDate: p.dueDate,
    due: fmtDate(p.dueDate),
    flagged: p.flagged,
    flagReason: p.flagReason,
    createdAt: p.createdAt,
  };
}

async function completeProject(p) {
  p.status = 'completed';
  p.progress = 100;

  const amount = p.escrowLocked || 0;
  const freelancer = p.assignedFreelancer;
  const client = p.client;

  if (amount > 0 && freelancer) {
    await Transaction.updateOne(
      { project: p._id, user: freelancer, status: 'pending', direction: 'in' },
      { $set: { status: 'paid', date: new Date(), amount, method: 'Escrow release' } }
    );
    await User.updateOne({ _id: freelancer }, { $inc: { balance: amount } });
    await User.updateOne({ _id: client }, { $inc: { escrowBalance: -amount } });
    await notify(freelancer, `Escrow released — $${amount} for "${p.title}" is now in your balance`, 'payment');
    await logActivity([client, freelancer], `${p.title} completed — $${amount} released from escrow`, 'emerald');
  } else {
    await logActivity([client, freelancer].filter(Boolean), `${p.title} marked complete`, 'emerald');
  }
  if (client) await notify(client, `Project "${p.title}" is complete`, 'project');
}

module.exports = router;
module.exports.mapProject = mapProject;
module.exports.completeProject = completeProject;

const express = require('express');
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Review = require('../models/Review');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { logActivity, notify, shortTime, fmtDate, initials, projectStatusLabel } = require('../utils/helpers');

const router = express.Router();

/* proposals I sent (freelancer) */
router.get('/mine', protect, authorizeRoles('freelancer'), async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate('project', 'title status budget dueDate progress client')
      .sort({ createdAt: -1 });

    res.json(
      proposals.map((pr) => ({
        id: pr._id,
        project: pr.project ? pr.project.title : 'Project',
        projectId: pr.project ? String(pr.project._id) : null,
        budget: pr.project ? pr.project.budget : 0,
        bid: pr.amount,
        match: pr.match,
        status: pr.status,
        eta: `${pr.deliveryDays}d`,
        summary: pr.coverLetter,
        time: shortTime(pr.createdAt),
        projectStatus: pr.project ? projectStatusLabel(pr.project) : '—',
        due: pr.project ? fmtDate(pr.project.dueDate) : '—',
      }))
    );
  } catch (err) {
    next(err);
  }
});

/* proposals received across my projects (client) */
router.get('/received', protect, authorizeRoles('client'), async (req, res, next) => {
  try {
    const projects = await Project.find({ client: req.user._id }).select('_id title budget');
    const ids = projects.map((p) => p._id);
    const titleMap = new Map(projects.map((p) => [String(p._id), p.title]));

    const proposals = await Proposal.find({ project: { $in: ids } })
      .populate('freelancer', 'name headline skills rating')
      .sort({ createdAt: -1 });

    const fids = proposals.map((p) => p.freelancer && p.freelancer._id).filter(Boolean);
    const completed = await Proposal.aggregate([
      { $match: { status: 'completed', freelancer: { $in: fids } } },
      { $group: { _id: '$freelancer', n: { $sum: 1 } } },
    ]);
    const jobsMap = new Map(completed.map((c) => [String(c._id), c.n]));

    const reviewAgg = await Review.aggregate([
      { $match: { reviewee: { $in: fids } } },
      { $group: { _id: '$reviewee', sum: { $sum: '$rating' }, n: { $sum: 1 } } },
    ]);
    const ratingMap = new Map(reviewAgg.map((r) => [String(r._id), Math.round((r.sum / r.n) * 10) / 10]));

    res.json(
      proposals
        .filter((pr) => pr.status === 'pending')
        .map((pr) => {
          const f = pr.freelancer;
          return {
            id: pr._id,
            project: titleMap.get(String(pr.project)) || 'Project',
            projectId: String(pr.project),
            freelancer: f ? f.name : 'Freelancer',
            freelancerId: f ? String(f._id) : null,
            initials: initials(f ? f.name : 'F'),
            bid: pr.amount,
            rating: f ? ratingMap.get(String(f._id)) || f.rating : 5,
            jobs: f ? jobsMap.get(String(f._id)) || 0 : 0,
            match: pr.match,
            eta: `${pr.deliveryDays}d`,
            deliveryDays: pr.deliveryDays,
            summary: pr.coverLetter,
            skills: f && f.skills ? f.skills.map((s) => s.name) : pr.skills,
            time: shortTime(pr.createdAt),
          };
        })
    );
  } catch (err) {
    next(err);
  }
});

/* accept a proposal -> start engagement + lock escrow */
router.post('/:id/accept', protect, authorizeRoles('client'), async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project').populate('freelancer', 'name');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    const project = proposal.project;
    if (!project.client.equals(req.user._id)) return res.status(403).json({ message: 'Not your project' });
    if (proposal.status !== 'pending') return res.status(400).json({ message: 'Proposal is already decided' });
    if (project.status !== 'open') return res.status(400).json({ message: 'Project is not open' });

    proposal.status = 'accepted';
    await proposal.save();

    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposal._id }, status: 'pending' },
      { $set: { status: 'declined' } }
    );

    project.assignedFreelancer = proposal.freelancer._id;
    project.status = 'in_progress';
    project.escrowLocked = proposal.amount;
    project.progress = 0;
    await project.save();

    await User.updateOne({ _id: project.client }, { $inc: { escrowBalance: proposal.amount } });
    await User.updateOne({ _id: proposal.freelancer._id }, { $inc: { balance: 0 } });

    await Transaction.create({
      user: project.client,
      project: project._id,
      title: project.title,
      party: proposal.freelancer.name,
      type: 'deposit',
      method: 'Escrow funding',
      amount: proposal.amount,
      direction: 'out',
      status: 'paid',
      date: new Date(),
    });

    await Transaction.create({
      user: proposal.freelancer._id,
      project: project._id,
      title: project.title,
      party: req.user.name,
      type: 'milestone',
      method: 'Escrow release',
      amount: proposal.amount,
      direction: 'in',
      status: 'pending',
      date: new Date(),
    });

    await notify(proposal.freelancer._id, `Your bid on "${project.title}" was accepted — $${proposal.amount} in escrow`, 'proposal');
    await notify(project.client, `Engagement started with ${proposal.freelancer.name} on "${project.title}"`, 'project');
    await logActivity(
      [project.client, proposal.freelancer._id],
      `${proposal.freelancer.name} hired for "${project.title}" — $${proposal.amount} locked in escrow`,
      'emerald'
    );

    res.json({ ok: true, projectId: String(project._id) });
  } catch (err) {
    next(err);
  }
});

/* decline a proposal */
router.post('/:id/decline', protect, authorizeRoles('client'), async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('project').populate('freelancer', 'name');
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });
    if (!proposal.project.client.equals(req.user._id)) return res.status(403).json({ message: 'Not your project' });
    if (proposal.status !== 'pending') return res.status(400).json({ message: 'Proposal is already decided' });

    proposal.status = 'declined';
    await proposal.save();
    proposal.project.proposalCount = Math.max(0, proposal.project.proposalCount - 1);
    await proposal.project.save();

    await notify(proposal.freelancer._id, `Your bid on "${proposal.project.title}" was not selected`, 'proposal');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

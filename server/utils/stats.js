const User = require('../models/User');
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const { projectStatusLabel, fmtDate } = require('./helpers');

const MONTHS = 12;

function monthKeys(n = MONTHS) {
  const keys = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

const mkey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

function fillFromKeys(map, keys, fallback = 0) {
  return keys.map((k) => (map.has(k) ? map.get(k) : fallback));
}

async function freelancerStats(userId) {
  const uid = userId;
  const keys = monthKeys();

  const [reviews, completedProjects, assignedProjects, pendingBids, txs, proposals] =
    await Promise.all([
      Review.find({ reviewee: uid }),
      Project.find({ assignedFreelancer: uid, status: 'completed' }),
      Project.find({ assignedFreelancer: uid }),
      Proposal.countDocuments({ freelancer: uid, status: 'pending' }),
      Transaction.find({ user: uid }).sort({ date: 1 }),
      Proposal.find({ freelancer: uid }),
    ]);

  const rating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 5.0;

  const jobs = completedProjects.length;
  const settled = assignedProjects.filter((p) => ['completed', 'cancelled', 'disputed'].includes(p.status));
  const success = settled.length ? Math.round((jobs / settled.length) * 100) : 100;

  const paidIn = txs.filter((t) => t.direction === 'in' && t.status === 'paid');
  const earned = paidIn.reduce((s, t) => s + t.amount, 0);
  const pendingAmt = txs
    .filter((t) => t.direction === 'in' && t.status === 'pending')
    .reduce((s, t) => s + t.amount, 0);

  const user = await User.findById(uid);

  const earnByMonth = new Map();
  paidIn.forEach((t) => earnByMonth.set(mkey(t.date), (earnByMonth.get(mkey(t.date)) || 0) + t.amount));

  const jobsByMonth = new Map();
  completedProjects.forEach((p) => jobsByMonth.set(mkey(p.createdAt), (jobsByMonth.get(mkey(p.createdAt)) || 0) + 1));

  const bidsByMonth = new Map();
  proposals.forEach((p) => bidsByMonth.set(mkey(p.createdAt), (bidsByMonth.get(mkey(p.createdAt)) || 0) + 1));

  const reviewByMonth = new Map();
  reviews.forEach((r) => {
    const k = mkey(r.createdAt);
    const cur = reviewByMonth.get(k);
    if (!cur) reviewByMonth.set(k, { sum: r.rating, n: 1 });
    else {
      cur.sum += r.rating;
      cur.n += 1;
    }
  });

  const monthlyEarn = fillFromKeys(earnByMonth, keys, 0);
  const monthlyJobs = fillFromKeys(jobsByMonth, keys, 0);
  const monthlyBids = fillFromKeys(bidsByMonth, keys, 0);
  const monthlyRating = keys.map((k) => {
    const v = reviewByMonth.get(k);
    return v ? Math.round((v.sum / v.n) * 10) / 10 : rating;
  });

  return {
    rating,
    jobs,
    success,
    earned,
    pending: pendingAmt,
    available: user ? user.balance : 0,
    activeBids: pendingBids,
    responseTime: user ? user.responseTime : '2h',
    onTime: user ? user.onTime : 98,
    monthlyEarn,
    monthlyJobs,
    monthlyBids,
    monthlyRating,
    sparks: {
      earned: monthlyEarn.slice(-8),
      jobs: monthlyJobs.slice(-8),
      rating: monthlyRating.slice(-8),
      bids: monthlyBids.slice(-8),
      success: monthlyEarn.slice(-8).map(() => success),
    },
  };
}

async function clientStats(userId) {
  const uid = userId;
  const keys = monthKeys();

  const [projects, proposals, reviews, txs] = await Promise.all([
    Project.find({ client: uid }),
    Proposal.find().populate({ path: 'project', select: 'client' }),
    Review.find({ reviewee: uid }),
    Transaction.find({ user: uid }).sort({ date: 1 }),
  ]);

  const myProjectIds = new Set(projects.map((p) => String(p._id)));
  const myProposals = proposals.filter((p) => p.project && myProjectIds.has(String(p.project._id)));

  const posted = projects.length;
  const active = projects.filter((p) => ['open', 'in_progress'].includes(p.status)).length;
  const hired = projects.filter((p) => p.assignedFreelancer).length;
  const hireRate = posted ? Math.round((hired / posted) * 100) : 0;
  const spent = txs.filter((t) => t.direction === 'out' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
  const avgBudget = posted
    ? Math.round(projects.reduce((s, p) => s + p.budget, 0) / posted)
    : 0;

  const reviewAvg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 5.0;

  const spendByMonth = new Map();
  txs.filter((t) => t.direction === 'out' && t.status === 'paid').forEach((t) =>
    spendByMonth.set(mkey(t.date), (spendByMonth.get(mkey(t.date)) || 0) + t.amount)
  );
  const postedByMonth = new Map();
  projects.forEach((p) => postedByMonth.set(mkey(p.createdAt), (postedByMonth.get(mkey(p.createdAt)) || 0) + 1));
  const bidsByMonth = new Map();
  myProposals.forEach((p) => bidsByMonth.set(mkey(p.createdAt), (bidsByMonth.get(mkey(p.createdAt)) || 0) + 1));

  const monthlySpend = fillFromKeys(spendByMonth, keys, 0);
  const monthlyPosted = fillFromKeys(postedByMonth, keys, 0);
  const monthlyBids = fillFromKeys(bidsByMonth, keys, 0);

  const user = await User.findById(uid);
  const activeProjects = projects.filter((p) => ['open', 'in_progress'].includes(p.status));
  const locked = activeProjects.reduce((s, p) => s + (p.escrowLocked || 0), 0);
  const allocated = activeProjects.reduce((s, p) => s + p.budget, 0);
  const next = activeProjects
    .filter((p) => p.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

  return {
    rating: reviewAvg,
    posted,
    active,
    hireRate,
    spent,
    avgBudget,
    repeat: user ? user.repeatClients : 40,
    proposals: myProposals.length,
    reviewCount: reviews.length,
    available: user ? user.balance : 0,
    monthlySpend,
    monthlyPosted,
    monthlyBids,
    sparks: {
      spend: monthlySpend.slice(-8),
      posted: monthlyPosted.slice(-8),
      bids: monthlyBids.slice(-8),
    },
    escrow: {
      locked,
      allocated,
      pct: allocated ? Math.round((locked / allocated) * 100) : 0,
      pendingMilestones: activeProjects.filter((p) => p.status === 'in_progress').length,
      next: next
        ? {
            label: next.title,
            amount: Math.max(1, Math.round((next.escrowLocked || next.budget) * ((next.progress || 0) / 100 || 0.25))),
            due: next.dueDate,
            pct: next.progress || 0,
          }
        : null,
    },
  };
}

async function enrichUser(user) {
  if (!user) return null;
  const plain = user.toObject ? user.toObject() : { ...user };
  plain.id = String(plain._id);
  if (plain.role === 'freelancer') plain.stats = await freelancerStats(plain._id);
  else if (plain.role === 'client') plain.stats = await clientStats(plain._id);
  else plain.stats = {};

  plain.website = plain.website || (plain.links && plain.links.website) || '';

  if (plain.role === 'client') {
    const posted = await Project.find({ client: plain._id })
      .populate('assignedFreelancer', 'name')
      .sort({ createdAt: -1 })
      .limit(6);
    plain.projects = posted.map((p) => ({
      id: String(p._id),
      title: p.title,
      budget: p.budget,
      status: projectStatusLabel(p),
      progress: p.progress || 0,
      freelancer: p.assignedFreelancer ? p.assignedFreelancer.name : 'Unassigned',
      due: fmtDate(p.dueDate),
    }));
  } else {
    plain.projects = [];
  }

  const reviews = await Review.find({ reviewee: plain._id })
    .populate('reviewer', 'name role company headline')
    .sort({ createdAt: -1 })
    .limit(6);
  plain.reviews = reviews.map((r) => {
    const reviewer = r.reviewer;
    const role = reviewer
      ? reviewer.company ||
        (reviewer.headline ? String(reviewer.headline).split('—')[0].trim() : reviewer.role)
      : r.role;
    return {
      id: r._id,
      name: reviewer ? reviewer.name : 'Anonymous',
      role,
      rating: r.rating,
      text: r.text,
      at: r.createdAt,
    };
  });
  return plain;
}

module.exports = { freelancerStats, clientStats, enrichUser, monthKeys, mkey };

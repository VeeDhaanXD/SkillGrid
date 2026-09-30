/* Seed the SkillGrid database with demo data for all 3 dashboards.
   Run: npm run seed  (from server/) */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Project = require('./models/Project');
const Proposal = require('./models/Proposal');
const Transaction = require('./models/Transaction');
const Review = require('./models/Review');
const Activity = require('./models/Activity');
const Notification = require('./models/Notification');
const Dispute = require('./models/Dispute');
const { computeMatch } = require('./utils/helpers');

dotenv.config();

const day = 864e5;
const ago = (d) => new Date(Date.now() - d * day);
const ahead = (d) => new Date(Date.now() + d * day);

async function setDates(Model, id, createdAt) {
  await Model.updateOne({ _id: id }, { $set: { createdAt, updatedAt: createdAt } });
}

async function seed() {
  await connectDB();

  console.log('[Seed] Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    Proposal.deleteMany({}),
    Transaction.deleteMany({}),
    Review.deleteMany({}),
    Activity.deleteMany({}),
    Notification.deleteMany({}),
    Dispute.deleteMany({}),
  ]);

  /* ---------------- users ---------------- */
  console.log('[Seed] Creating users...');
  const mk = (data) => User.create(data);

  const admin = await mk({
    name: 'Aria Chen',
    email: 'admin@skillgrid.io',
    password: 'password123',
    role: 'admin',
    headline: 'Platform operations',
    location: 'Singapore',
    timezone: 'GMT+8',
    memberSince: 'Jan 2023',
    verified: { email: true, identity: true, payment: true },
  });

  const maya = await mk({
    name: 'Maya Okafor',
    email: 'maya@skillgrid.io',
    password: 'password123',
    role: 'client',
    headline: 'Product lead shipping data-heavy web apps',
    company: 'Northwind Labs',
    industry: 'SaaS / Analytics',
    companySize: '11-50',
    website: 'northwindlabs.io',
    founded: '2019',
    location: 'Berlin, Germany',
    timezone: 'GMT+2',
    memberSince: 'Mar 2023',
    bio: 'Northwind Labs builds realtime analytics tooling for logistics teams. We post scoped, well-funded projects and value clear communication over micromanagement.',
    budgetRange: '$1,000 - $5,000',
    engagement: 'Fixed-price',
    categories: ['Frontend', 'Backend', 'Full Stack'],
    payment: { method: 'Visa •••• 4242', nextCharge: 'Oct 12' },
    team: [
      { name: 'Maya Okafor', role: 'Owner', initials: 'MO' },
      { name: 'Jonas Weber', role: 'Engineering', initials: 'JW' },
      { name: 'Sara Lindqvist', role: 'Design', initials: 'SL' },
    ],
    verified: { email: true, identity: true, payment: true },
    balance: 0,
    escrowBalance: 4500,
    repeatClients: 62,
    isVerified: true,
  });

  const diego = await mk({
    name: 'Diego Martins',
    email: 'diego@skillgrid.io',
    password: 'password123',
    role: 'client',
    headline: 'Founder at a web3-native creative studio',
    company: 'Cobalt Studio',
    industry: 'Web3 / Creative',
    companySize: '2-10',
    website: 'cobalt.studio',
    founded: '2021',
    location: 'Lisbon, Portugal',
    timezone: 'GMT+1',
    memberSince: 'Jul 2023',
    bio: 'Cobalt Studio ships dApps, minting experiences and brand systems for NFT communities. Fast cycles, crypto-native scope.',
    budgetRange: '$500 - $3,000',
    engagement: 'Fixed-price',
    categories: ['Web3', 'Frontend', 'AI / ML'],
    payment: { method: 'Metamask wallet', nextCharge: 'On release' },
    team: [{ name: 'Diego Martins', role: 'Founder', initials: 'DM' }],
    verified: { email: true, identity: true, payment: false },
    balance: 0,
    escrowBalance: 5300,
    repeatClients: 35,
    isVerified: true,
  });

  const tomas = await mk({
    name: 'Tomas Vance',
    email: 'tomas@skillgrid.io',
    password: 'password123',
    role: 'client',
    headline: 'Growth marketing',
    company: 'Vance Digital',
    industry: 'Marketing',
    companySize: '2-10',
    location: 'Austin, TX',
    timezone: 'GMT-5',
    memberSince: 'Aug 2025',
    bio: 'Performance marketing agency.',
    budgetRange: 'Under $500',
    engagement: 'Hourly',
    categories: ['Frontend'],
    payment: { method: 'Mastercard •••• 8811', nextCharge: '—' },
    verified: { email: true, identity: false, payment: false },
    status: 'suspended',
  });

  const alex = await mk({
    name: 'Alex Rivera',
    email: 'alex@skillgrid.io',
    password: 'password123',
    role: 'freelancer',
    headline: 'Senior Full-Stack Engineer — React, Node & realtime systems',
    location: 'Austin, TX',
    timezone: 'GMT-5',
    memberSince: 'Feb 2023',
    bio: '8 years shipping production web apps. I specialise in React dashboards, Node APIs and realtime data pipelines — clean handoffs, typed code, zero drama.',
    rate: 65,
    availability: 'Available',
    hoursPerWeek: 35,
    skills: [
      { name: 'React', level: 95 },
      { name: 'Node.js', level: 90 },
      { name: 'MongoDB', level: 85 },
      { name: 'Tailwind', level: 92 },
      { name: 'TypeScript', level: 88 },
      { name: 'GSAP', level: 80 },
    ],
    languages: ['English (native)', 'Spanish (fluent)'],
    education: [{ title: 'B.S. Computer Science', school: 'UT Austin', year: '2017' }],
    certifications: ['AWS Certified Developer – Associate', 'MongoDB Associate Developer'],
    links: { github: 'github.com/alexrivera', linkedin: 'linkedin.com/in/alexrivera', website: 'alexrivera.dev' },
    portfolio: [
      { title: 'FleetPulse Telemetry', tag: 'Dashboard', desc: 'Realtime vehicle telemetry for 12k trucks — WebSocket pipelines, D3 charts, sub-second updates.', stack: ['React', 'Node.js', 'WebSocket'] },
      { title: 'Ledgerlight Invoicing', tag: 'SaaS', desc: 'Multi-tenant invoicing platform with PDF generation and Stripe billing for 400+ SMEs.', stack: ['React', 'PostgreSQL', 'Stripe'] },
      { title: 'Mintroom Studio', tag: 'Web3', desc: 'NFT minting flow with allowlists, gas estimation and a live drop calendar.', stack: ['Next.js', 'ethers.js', 'Tailwind'] },
    ],
    verified: { email: true, identity: true, payment: true },
    responseTime: '2h',
    onTime: 98,
    rating: 4.8,
    balance: 6200,
    isVerified: true,
  });

  const priya = await mk({
    name: 'Priya Sharma',
    email: 'priya@skillgrid.io',
    password: 'password123',
    role: 'freelancer',
    headline: 'Backend & AI engineer — Python, LLM pipelines, AWS',
    location: 'Bengaluru, India',
    timezone: 'GMT+5:30',
    memberSince: 'Sep 2023',
    bio: 'Backend engineer focused on APIs, data pipelines and LLM integrations. I write tests first and document everything.',
    rate: 55,
    availability: 'Available',
    hoursPerWeek: 30,
    skills: [
      { name: 'Python', level: 94 },
      { name: 'Django', level: 88 },
      { name: 'PostgreSQL', level: 86 },
      { name: 'AWS', level: 82 },
      { name: 'Node.js', level: 70 },
      { name: 'Redis', level: 75 },
    ],
    languages: ['English (fluent)', 'Hindi (native)'],
    education: [{ title: 'B.Tech Information Technology', school: 'NIT Karnataka', year: '2018' }],
    certifications: ['AWS Solutions Architect – Associate'],
    links: { github: 'github.com/priyasharma', linkedin: 'linkedin.com/in/priyasharma', website: '' },
    portfolio: [
      { title: 'DocuMind Extractor', tag: 'AI', desc: 'LLM pipeline extracting structured data from contracts at 99.2% field accuracy.', stack: ['Python', 'FastAPI', 'OpenAI'] },
      { title: 'Relay Queue', tag: 'Backend', desc: 'Job queue handling 4M tasks/day with Redis + PostgreSQL exactly-once semantics.', stack: ['Node.js', 'Redis', 'PostgreSQL'] },
    ],
    verified: { email: true, identity: true, payment: true },
    responseTime: '4h',
    onTime: 96,
    balance: 0,
    isVerified: true,
  });

  const sam = await mk({
    name: 'Sam Carter',
    email: 'sam@skillgrid.io',
    password: 'password123',
    role: 'freelancer',
    headline: 'Frontend engineer & design-system specialist',
    location: 'Toronto, Canada',
    timezone: 'GMT-4',
    memberSince: 'Nov 2023',
    bio: 'I turn Figma files into fast, accessible interfaces. Storybook, Tailwind and obsessive pixel discipline.',
    rate: 50,
    availability: 'Available',
    hoursPerWeek: 25,
    skills: [
      { name: 'React', level: 92 },
      { name: 'Tailwind', level: 94 },
      { name: 'Storybook', level: 88 },
      { name: 'Next.js', level: 85 },
      { name: 'TypeScript', level: 80 },
      { name: 'Figma', level: 78 },
    ],
    languages: ['English (native)'],
    education: [{ title: 'B.A. Interaction Design', school: 'OCAD University', year: '2019' }],
    certifications: ['Google UX Design Certificate'],
    links: { github: 'github.com/samcarter', linkedin: 'linkedin.com/in/samcarter', website: 'samcarter.design' },
    portfolio: [
      { title: 'Orbit Design System', tag: 'Design System', desc: '84-component library with tokens, dark mode and a11y audits adopted by 6 product teams.', stack: ['React', 'Storybook', 'Tailwind'] },
    ],
    verified: { email: true, identity: true, payment: true },
    responseTime: '3h',
    onTime: 97,
    balance: 0,
    isVerified: true,
  });

  const lena = await mk({
    name: 'Lena Fischer',
    email: 'lena@skillgrid.io',
    password: 'password123',
    role: 'freelancer',
    headline: 'DevOps-minded backend developer — Express, Docker, CI/CD',
    location: 'Berlin, Germany',
    timezone: 'GMT+2',
    memberSince: 'Apr 2024',
    bio: 'I build resilient APIs and the pipelines that keep them alive. Express, Docker, GitHub Actions, and a healthy fear of downtime.',
    rate: 60,
    availability: 'Busy',
    hoursPerWeek: 20,
    skills: [
      { name: 'Node.js', level: 90 },
      { name: 'Express', level: 92 },
      { name: 'Docker', level: 86 },
      { name: 'Redis', level: 80 },
      { name: 'MongoDB', level: 84 },
      { name: 'AWS', level: 76 },
    ],
    languages: ['German (native)', 'English (fluent)'],
    education: [{ title: 'B.Sc. Software Engineering', school: 'TU Berlin', year: '2020' }],
    certifications: ['Certified Kubernetes Application Developer'],
    links: { github: 'github.com/lenafischer', linkedin: 'linkedin.com/in/lenafischer', website: '' },
    portfolio: [],
    verified: { email: true, identity: false, payment: true },
    responseTime: '5h',
    onTime: 95,
    balance: 0,
    isVerified: true,
  });

  const users = { admin, maya, diego, tomas, alex, priya, sam, lena };

  /* ---------------- projects ---------------- */
  console.log('[Seed] Creating projects...');
  const mkProject = (d) => Project.create(d);

  const p_dash = await mkProject({
    title: 'Realtime Analytics Dashboard', client: maya._id, assignedFreelancer: alex._id,
    description: 'A realtime analytics dashboard for fleet telemetry: live charts, filterable tables and CSV export for 12k vehicles.',
    budget: 2400, escrowLocked: 2400, skillsRequired: ['React', 'Node.js', 'GSAP', 'Tailwind'],
    category: 'Frontend', duration: '2 weeks', deadlineDays: 14, dueDate: ago(9),
    status: 'completed', proposalCount: 2, progress: 100,
  });
  const p_web3 = await mkProject({
    title: 'NFT Minting dApp Audit', client: diego._id, assignedFreelancer: alex._id,
    description: 'Security and UX audit of an ERC-721 minting flow, plus a hardening checklist and remediation PRs.',
    budget: 1500, escrowLocked: 1500, skillsRequired: ['React', 'ethers.js', 'TypeScript'],
    category: 'Web3', duration: '1 week', deadlineDays: 7, dueDate: ago(20),
    status: 'completed', proposalCount: 1, progress: 100,
  });
  const p_api = await mkProject({
    title: 'Scalable API Gateway', client: maya._id, assignedFreelancer: alex._id,
    description: 'Node.js gateway with rate limiting, JWT auth and request tracing in front of 14 internal microservices.',
    budget: 1800, escrowLocked: 1800, skillsRequired: ['Node.js', 'Express', 'Redis', 'Docker'],
    category: 'Backend', duration: '2 weeks', deadlineDays: 14, dueDate: ago(35),
    status: 'completed', proposalCount: 1, progress: 100,
  });
  const p_content = await mkProject({
    title: 'Content Migration Sprint', client: maya._id, assignedFreelancer: alex._id,
    description: 'Migrate 900 CMS articles to a MDX-based static site with redirects and metadata intact.',
    budget: 800, escrowLocked: 800, skillsRequired: ['React', 'Node.js'],
    category: 'Full Stack', duration: '1 week', deadlineDays: 7, dueDate: ago(50),
    status: 'completed', proposalCount: 1, progress: 100,
  });
  const p_ai = await mkProject({
    title: 'LLM Chat Widget Integration', client: diego._id, assignedFreelancer: alex._id,
    description: 'Embeddable chat widget backed by an LLM API: streaming responses, markdown rendering and conversation history.',
    budget: 3200, escrowLocked: 3200, skillsRequired: ['React', 'Node.js', 'TypeScript', 'AI / ML'],
    category: 'AI / ML', duration: '1 month', deadlineDays: 30, dueDate: ahead(6),
    status: 'in_progress', proposalCount: 1, progress: 60,
  });
  const p_3d = await mkProject({
    title: '3D Product Configurator', client: maya._id, assignedFreelancer: alex._id,
    description: 'WebGL product configurator with material swatches, AR quick-look and a shareable configuration link.',
    budget: 2600, escrowLocked: 2600, skillsRequired: ['React', 'Three.js', 'GSAP'],
    category: '3D / WebGL', duration: '1 month', deadlineDays: 30, dueDate: ahead(12),
    status: 'in_progress', proposalCount: 1, progress: 35,
  });
  const p_disp = await mkProject({
    title: 'Payment Flow Redesign', client: maya._id, assignedFreelancer: alex._id,
    description: 'Redesign checkout with saved cards, 3DS handling and a recovery path for failed charges.',
    budget: 1900, escrowLocked: 1900, skillsRequired: ['React', 'Node.js', 'Stripe'],
    category: 'Full Stack', duration: '2 weeks', deadlineDays: 14, dueDate: ahead(3),
    status: 'disputed', proposalCount: 1, progress: 55,
  });
  const p_disp3 = await mkProject({
    title: 'E-commerce Checkout Rewrite', client: diego._id, assignedFreelancer: priya._id,
    description: 'Rewrite legacy checkout service in Node.js with inventory reservations and webhook retries.',
    budget: 2100, escrowLocked: 2100, skillsRequired: ['Node.js', 'Express', 'PostgreSQL'],
    category: 'Backend', duration: '2 weeks', deadlineDays: 14, dueDate: ahead(9),
    status: 'disputed', proposalCount: 1, progress: 40,
  });
  const p_ds = await mkProject({
    title: 'Design System Overhaul', client: maya._id,
    description: 'Rebuild our component library in Storybook with design tokens, dark mode and accessibility audits.',
    budget: 1800, skillsRequired: ['React', 'Storybook', 'Tailwind'],
    category: 'Frontend', duration: '2 weeks', deadlineDays: 14, dueDate: ahead(21),
    status: 'open', proposalCount: 2, progress: 0,
  });
  const p_node = await mkProject({
    title: 'Node.js Microservice Refactor', client: diego._id,
    description: 'Split a 6k-line monolith service into typed Express modules with integration tests and Docker compose.',
    budget: 2200, skillsRequired: ['Node.js', 'Express', 'Docker', 'MongoDB'],
    category: 'Backend', duration: '1 month', deadlineDays: 30, dueDate: ahead(28),
    status: 'open', proposalCount: 2, progress: 0,
  });
  const p_w3 = await mkProject({
    title: 'Web3 Staking Dashboard', client: diego._id,
    description: 'Staking dashboard showing pools, APR, and claim history with wallet connect and transaction states.',
    budget: 3500, skillsRequired: ['React', 'ethers.js', 'TypeScript', 'Tailwind'],
    category: 'Web3', duration: '1 month', deadlineDays: 30, dueDate: ahead(34),
    status: 'open', proposalCount: 3, progress: 0,
  });
  const p_ai2 = await mkProject({
    title: 'AI Resume Screener', client: maya._id,
    description: 'Internal tool that scores incoming resumes against a job spec using an LLM, with a reviewer queue.',
    budget: 2800, skillsRequired: ['React', 'Node.js', 'Python', 'AI / ML'],
    category: 'AI / ML', duration: '2 weeks', deadlineDays: 14, dueDate: ahead(18),
    status: 'open', proposalCount: 1, progress: 0,
  });
  const p_mvp = await mkProject({
    title: 'Full Stack Marketplace MVP', client: maya._id,
    description: 'Two-sided marketplace MVP: listings, search, escrow checkout, reviews and an admin console.',
    budget: 5000, skillsRequired: ['React', 'Node.js', 'MongoDB', 'Tailwind'],
    category: 'Full Stack', duration: '2 months', deadlineDays: 60, dueDate: ahead(55),
    status: 'open', proposalCount: 2, progress: 0,
  });
  const p_flag1 = await mkProject({
    title: 'Crypto Doubling Platform', client: tomas._id,
    description: 'Guaranteed 2x crypto returns platform. Need it built fast, minimal compliance checks.',
    budget: 900, skillsRequired: ['React', 'Node.js'],
    category: 'Web3', duration: '1 week', deadlineDays: 7, dueDate: ahead(7),
    status: 'open', proposalCount: 0, progress: 0,
    flagged: true, flagReason: 'Reported as scam by 4 users',
  });
  const p_flag2 = await mkProject({
    title: 'Quick Backlink Boost', client: tomas._id,
    description: 'Buy 10,000 backlinks and rank #1 on Google in a week.',
    budget: 400, skillsRequired: ['Frontend'],
    category: 'Frontend', duration: '1 week', deadlineDays: 7, dueDate: ahead(5),
    status: 'open', proposalCount: 0, progress: 0,
    flagged: true, flagReason: 'Spam / misleading claims',
  });
  const p_cancel = await mkProject({
    title: 'Legacy jQuery Migration', client: diego._id,
    description: 'Port marketing pages from jQuery to React — cancelled when the campaign was paused.',
    budget: 700, skillsRequired: ['React', 'jQuery'],
    category: 'Frontend', duration: '1 week', deadlineDays: 7, dueDate: ago(14),
    status: 'cancelled', proposalCount: 0, progress: 0,
  });

  const projectList = [p_dash, p_web3, p_api, p_content, p_ai, p_3d, p_disp, p_disp3, p_ds, p_node, p_w3, p_ai2, p_mvp, p_flag1, p_flag2, p_cancel];
  const createdDates = {
    [p_dash._id]: ago(45), [p_web3._id]: ago(33), [p_api._id]: ago(48), [p_content._id]: ago(58),
    [p_ai._id]: ago(24), [p_3d._id]: ago(16), [p_disp._id]: ago(29), [p_disp3._id]: ago(21),
    [p_ds._id]: ago(6), [p_node._id]: ago(5), [p_w3._id]: ago(4), [p_ai2._id]: ago(2),
    [p_mvp._id]: ago(1), [p_flag1._id]: ago(8), [p_flag2._id]: ago(11), [p_cancel._id]: ago(20),
  };
  for (const p of projectList) await setDates(Project, p._id, createdDates[p._id]);

  /* ---------------- proposals ---------------- */
  console.log('[Seed] Creating proposals...');
  const skillsOf = (u) => (u.skills || []).map((s) => s.name);
  const mkProposal = async (project, freelancer, amount, deliveryDays, coverLetter, status, createdAgo) => {
    const pr = await Proposal.create({
      project: project._id,
      freelancer: freelancer._id,
      amount,
      deliveryDays,
      coverLetter,
      skills: skillsOf(freelancer).slice(0, 4),
      match: computeMatch(project.skillsRequired, skillsOf(freelancer)),
      status,
    });
    await setDates(Proposal, pr._id, ago(createdAgo));
    return pr;
  };

  // accepted / historical
  await mkProposal(p_dash, alex, 2300, 14, 'I have shipped three fleet dashboards with WebSocket pipelines — happy to walk through the architecture first.', 'accepted', 45);
  await mkProposal(p_dash, lena, 2400, 10, 'Express + Redis background jobs fit this well.', 'declined', 44);
  await mkProposal(p_web3, alex, 1450, 7, 'Audited 12 minting contracts this year; checklist attached in my portfolio.', 'accepted', 33);
  await mkProposal(p_api, alex, 1750, 14, 'Rate-limited gateways with tracing are my day job.', 'accepted', 48);
  await mkProposal(p_content, alex, 780, 6, 'MDX migration tooling already built — can reuse the transform scripts.', 'accepted', 58);
  await mkProposal(p_ai, alex, 3100, 28, 'Streaming widget with markdown + history: I will deliver an interactive prototype in week one.', 'accepted', 24);
  await mkProposal(p_3d, alex, 2500, 30, 'Three.js configurator with AR quick-look — see FleetPulse and Mintroom in my portfolio.', 'accepted', 16);
  await mkProposal(p_disp, alex, 1850, 12, 'Stripe + 3DS flows across two fintech clients. I can start Monday.', 'accepted', 29);
  await mkProposal(p_disp3, priya, 2050, 14, 'Checkout services are my core work — inventory reservations with Postgres advisory locks.', 'accepted', 21);

  // pending on open jobs
  await mkProposal(p_ds, sam, 1650, 12, 'Rebuilt Orbit Design System (84 components) — Storybook + tokens + a11y audits included.', 'pending', 4);
  await mkProposal(p_ds, priya, 1750, 14, 'I can pair the component work with the token pipeline in Style Dictionary.', 'pending', 3);
  await mkProposal(p_node, lena, 2100, 24, 'Docker compose + typed Express modules, with integration tests as the acceptance gate.', 'pending', 5);
  await mkProposal(p_node, priya, 2000, 26, 'Monolith splits are routine for me — strangler pattern, zero downtime.', 'pending', 4);
  await mkProposal(p_w3, alex, 3300, 28, 'Wallet connect, APR math and claim history — shipped twice for DAO dashboards.', 'pending', 2);
  await mkProposal(p_w3, sam, 3450, 30, 'Frontend-first approach: transaction states and a polished empty-state system.', 'pending', 2);
  await mkProposal(p_w3, lena, 3100, 25, 'Indexer + API included so the dashboard stays fast as history grows.', 'pending', 1);
  await mkProposal(p_ai2, alex, 2600, 14, 'LLM scoring with a reviewer queue — I will ship a calibrated rubric before UI polish.', 'pending', 1);
  await mkProposal(p_mvp, sam, 4700, 55, 'Full build with a design-system-first approach so future pages stay cheap.', 'pending', 1);
  await mkProposal(p_mvp, lena, 4900, 50, 'Backend-heavy plan: escrow checkout + admin console, React shell on top.', 'pending', 0.4);

  /* ---------------- transactions ---------------- */
  console.log('[Seed] Creating transactions...');
  const mkTx = (d) => Transaction.create(d);
  const tx = [];
  // freelancer earnings (Alex)
  tx.push(await mkTx({ user: alex._id, project: p_dash._id, title: p_dash.title, party: 'Maya Okafor', type: 'escrow_release', method: 'Escrow release', amount: 2400, direction: 'in', status: 'paid', date: ago(9) }));
  tx.push(await mkTx({ user: alex._id, project: p_web3._id, title: p_web3.title, party: 'Diego Martins', type: 'escrow_release', method: 'Escrow release', amount: 1500, direction: 'in', status: 'paid', date: ago(20) }));
  tx.push(await mkTx({ user: alex._id, project: p_api._id, title: p_api.title, party: 'Maya Okafor', type: 'escrow_release', method: 'Escrow release', amount: 1800, direction: 'in', status: 'paid', date: ago(35) }));
  tx.push(await mkTx({ user: alex._id, project: p_content._id, title: p_content.title, party: 'Maya Okafor', type: 'escrow_release', method: 'Escrow release', amount: 800, direction: 'in', status: 'paid', date: ago(50) }));
  tx.push(await mkTx({ user: alex._id, title: 'Hourly bonus — on-call support', party: 'Cobalt Studio', type: 'bonus', method: 'Hourly bonus', amount: 1200, direction: 'in', status: 'paid', date: ago(72) }));
  tx.push(await mkTx({ user: alex._id, title: 'Hourly bonus — production fixes', party: 'Northwind Labs', type: 'bonus', method: 'Hourly bonus', amount: 900, direction: 'in', status: 'paid', date: ago(96) }));
  tx.push(await mkTx({ user: alex._id, project: p_ai._id, title: p_ai.title, party: 'Diego Martins', type: 'milestone', method: 'Escrow release', amount: 3200, direction: 'in', status: 'pending', date: ago(24) }));
  tx.push(await mkTx({ user: alex._id, project: p_3d._id, title: p_3d.title, party: 'Maya Okafor', type: 'milestone', method: 'Escrow release', amount: 2600, direction: 'in', status: 'pending', date: ago(16) }));
  tx.push(await mkTx({ user: alex._id, project: p_disp._id, title: p_disp.title, party: 'Maya Okafor', type: 'milestone', method: 'Escrow release', amount: 1900, direction: 'in', status: 'pending', date: ago(29) }));
  tx.push(await mkTx({ user: alex._id, title: 'Payout to bank account', party: 'SkillGrid', type: 'withdrawal', method: 'Bank transfer', amount: 1500, direction: 'out', status: 'paid', date: ago(40) }));
  tx.push(await mkTx({ user: alex._id, title: 'Payout to bank account', party: 'SkillGrid', type: 'withdrawal', method: 'Bank transfer', amount: 900, direction: 'out', status: 'paid', date: ago(15) }));
  // priya pending on disputed project
  tx.push(await mkTx({ user: priya._id, project: p_disp3._id, title: p_disp3.title, party: 'Diego Martins', type: 'milestone', method: 'Escrow release', amount: 2100, direction: 'in', status: 'pending', date: ago(21) }));
  // client funding (Maya / Diego)
  tx.push(await mkTx({ user: maya._id, project: p_dash._id, title: p_dash.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 2400, direction: 'out', status: 'paid', date: ago(45) }));
  tx.push(await mkTx({ user: maya._id, project: p_api._id, title: p_api.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 1800, direction: 'out', status: 'paid', date: ago(48) }));
  tx.push(await mkTx({ user: maya._id, project: p_content._id, title: p_content.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 800, direction: 'out', status: 'paid', date: ago(58) }));
  tx.push(await mkTx({ user: maya._id, project: p_3d._id, title: p_3d.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 2600, direction: 'out', status: 'paid', date: ago(16) }));
  tx.push(await mkTx({ user: maya._id, project: p_disp._id, title: p_disp.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 1900, direction: 'out', status: 'paid', date: ago(29) }));
  tx.push(await mkTx({ user: diego._id, project: p_web3._id, title: p_web3.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 1500, direction: 'out', status: 'paid', date: ago(33) }));
  tx.push(await mkTx({ user: diego._id, project: p_ai._id, title: p_ai.title, party: 'Alex Rivera', type: 'deposit', method: 'Escrow funding', amount: 3200, direction: 'out', status: 'paid', date: ago(24) }));
  tx.push(await mkTx({ user: diego._id, project: p_disp3._id, title: p_disp3.title, party: 'Priya Sharma', type: 'deposit', method: 'Escrow funding', amount: 2100, direction: 'out', status: 'paid', date: ago(21) }));

  /* ---------------- reviews ---------------- */
  console.log('[Seed] Creating reviews...');
  const mkReview = async (reviewer, reviewee, project, role, rating, text, createdAgo) => {
    const r = await Review.create({ reviewer: reviewer._id, reviewee: reviewee._id, project: project._id, role, rating, text });
    await setDates(Review, r._id, ago(createdAgo));
    return r;
  };
  await mkReview(maya, alex, p_dash, 'freelancer', 5, 'Alex shipped the dashboard ahead of schedule and the realtime charts handled our load without breaking a sweat. Best hire this year.', 9);
  await mkReview(diego, alex, p_web3, 'freelancer', 5, 'Sharp audit — found two issues our own review missed, and the remediation PRs merged clean.', 20);
  await mkReview(maya, alex, p_api, 'freelancer', 4, 'Solid gateway work. Communication slipped once or twice but the final architecture is excellent.', 35);
  await mkReview(maya, alex, p_content, 'freelancer', 5, '900 articles migrated with zero broken redirects. Exactly as scoped.', 50);
  await mkReview(alex, maya, p_dash, 'client', 5, 'Clear specs, fast feedback loops, and milestones funded on time. Would work with Maya again any day.', 8);
  await mkReview(alex, maya, p_content, 'client', 4, 'Scope changed a couple of times mid-sprint, but Maya was reasonable about it every time.', 50);
  await mkReview(alex, diego, p_web3, 'client', 5, 'Crypto-native scope done right — Diego knew exactly what he wanted and paid instantly.', 19);
  await mkReview(priya, diego, p_disp3, 'client', 4, 'Diego is decisive and pays well, though responses slowed down during the dispute.', 10);

  /* ---------------- activity feed ---------------- */
  console.log('[Seed] Creating activity...');
  const mkAct = async (at, users, text, tone) => Activity.create({ users: users.map((u) => u._id), text, tone, at });
  await mkAct(ago(9), [maya, alex], `${p_dash.title} completed — $2,400 released from escrow`, 'emerald');
  await mkAct(ago(20), [diego, alex], `${p_web3.title} completed — $1,500 released from escrow`, 'emerald');
  await mkAct(ago(6), [maya], `Posted "${p_ds.title}" to the marketplace`, 'emerald');
  await mkAct(ago(4), [diego], `Posted "${p_w3.title}" to the marketplace`, 'emerald');
  await mkAct(ago(4), [maya, sam], `Sam Carter bid $1,650 on "${p_ds.title}"`, 'sky');
  await mkAct(ago(3), [maya, priya], `Priya Sharma bid $1,750 on "${p_ds.title}"`, 'sky');
  await mkAct(ago(5), [diego, lena], `Lena Fischer bid $2,100 on "${p_node.title}"`, 'sky');
  await mkAct(ago(2), [diego, alex], `Alex Rivera bid $3,300 on "${p_w3.title}"`, 'sky');
  await mkAct(ago(16), [maya, alex], `Escrow funded for "${p_3d.title}" — $2,600 locked`, 'sky');
  await mkAct(ago(4), [maya, alex], `Dispute opened on "${p_disp.title}"`, 'rose');
  await mkAct(ago(15), [alex], `Withdrew $900 from available balance`, 'sky');
  await mkAct(ago(29), [maya, alex], `Escrow funded for "${p_disp.title}" — $1,900 locked`, 'sky');
  await mkAct(ago(1), [maya, alex], `Alex Rivera bid $2,600 on "${p_ai2.title}"`, 'sky');
  await mkAct(ago(2), [tomas], `Project "${p_flag1.title}" was flagged for review`, 'rose');
  await mkAct(ago(12), [diego, priya], `Escrow funded for "${p_disp3.title}" — $2,100 locked`, 'sky');

  /* ---------------- notifications ---------------- */
  console.log('[Seed] Creating notifications...');
  const mkNote = async (user, text, kind, read) => Notification.create({ user: user._id, text, kind, read, at: ago(1) });
  await mkNote(maya, 'Sam Carter submitted a bid on "Design System Overhaul"', 'proposal', false);
  await mkNote(maya, 'Priya Sharma submitted a bid on "Design System Overhaul"', 'proposal', false);
  await mkNote(maya, 'A dispute was opened on "Payment Flow Redesign"', 'alert', false);
  await mkNote(maya, 'Project "Full Stack Marketplace MVP" is live — matching freelancers now', 'project', true);
  await mkNote(alex, 'A dispute was opened on "Payment Flow Redesign"', 'alert', false);
  await mkNote(alex, 'Withdrawal of $900 initiated — expect funds in 1–2 business days', 'payment', true);
  await mkNote(alex, 'Your bid on "AI Resume Screener" is pending review', 'proposal', false);
  await mkNote(diego, 'Lena Fischer submitted a bid on "Node.js Microservice Refactor"', 'proposal', false);
  await mkNote(diego, 'Your project "E-commerce Checkout Rewrite" is under dispute', 'alert', false);
  await mkNote(admin, 'New dispute opened on "Payment Flow Redesign" — $1,900 at stake', 'alert', false);
  await mkNote(admin, 'Project "Crypto Doubling Platform" was flagged by 4 users', 'alert', false);
  await mkNote(tomas, 'Your project "Crypto Doubling Platform" was flagged for review', 'alert', false);

  /* ---------------- disputes ---------------- */
  console.log('[Seed] Creating disputes...');
  const d1 = await Dispute.create({
    project: p_disp._id, initiatedBy: maya._id,
    reason: 'Milestone delivered late and off-spec — requesting a partial refund after two revision rounds.',
    amountDisputed: 1900, status: 'open',
  });
  const d2 = await Dispute.create({
    project: p_disp3._id, initiatedBy: priya._id,
    reason: 'Client stopped responding to revision requests for 10 days with the milestone 40% complete.',
    amountDisputed: 2100, status: 'open',
  });
  const d3 = await Dispute.create({
    project: p_content._id, initiatedBy: maya._id,
    reason: 'Two articles lost metadata during migration — resolved after a follow-up fix.',
    amountDisputed: 800, status: 'resolved_dev_release',
    resolution: 'release', adminNotes: 'Scope was met; release full amount to developer.',
    resolvedBy: admin._id, resolvedAt: ago(30),
  });
  await setDates(Dispute, d1._id, ago(4));
  await setDates(Dispute, d2._id, ago(7));
  await setDates(Dispute, d3._id, ago(32));

  console.log('[Seed] Done.');
  console.log('  Demo logins (password: password123):');
  console.log('    client:      maya@skillgrid.io');
  console.log('    freelancer:  alex@skillgrid.io');
  console.log('    admin:       admin@skillgrid.io');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed Error]', err);
  process.exit(1);
});

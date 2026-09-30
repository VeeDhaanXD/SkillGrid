const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    budget: { type: Number, required: true },
    escrowLocked: { type: Number, default: 0 },
    skillsRequired: [{ type: String }],
    category: {
      type: String,
      enum: ['Frontend', 'Backend', 'Full Stack', '3D / WebGL', 'Web3', 'AI / ML'],
      default: 'Full Stack',
    },
    duration: { type: String, default: '2 weeks' },
    deadlineDays: { type: Number, default: 14 },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'disputed', 'cancelled'],
      default: 'open',
    },
    proposalCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });

module.exports = mongoose.model('Project', projectSchema);

const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: { type: String, required: true },
    amountDisputed: { type: Number, required: true },
    status: {
      type: String,
      enum: ['open', 'resolved_client_refund', 'resolved_dev_release'],
      default: 'open',
    },
    resolution: { type: String, enum: ['refund', 'release', ''], default: '' },
    adminNotes: { type: String, default: '' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);

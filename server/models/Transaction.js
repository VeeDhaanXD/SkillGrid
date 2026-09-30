const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    title: { type: String, required: true },
    party: { type: String, default: '' },
    type: {
      type: String,
      enum: ['escrow_release', 'milestone', 'bonus', 'withdrawal', 'deposit', 'refund'],
      default: 'escrow_release',
    },
    method: { type: String, default: 'Escrow release' },
    amount: { type: Number, required: true },
    direction: { type: String, enum: ['in', 'out'], default: 'in' },
    status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

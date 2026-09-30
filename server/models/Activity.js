const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    text: { type: String, required: true },
    tone: { type: String, default: 'emerald' },
    kind: { type: String, default: 'general' },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

activitySchema.index({ users: 1, at: -1 });

module.exports = mongoose.model('Activity', activitySchema);

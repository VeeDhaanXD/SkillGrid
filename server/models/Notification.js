const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    kind: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

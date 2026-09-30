const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const { shortTime } = require('../utils/helpers');

const router = express.Router();

router.get('/', protect, async (req, res, next) => {
  try {
    const [items, unread] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ at: -1 }).limit(12),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);
    res.json({
      unread,
      notifications: items.map((n) => ({
        id: n._id,
        text: n.text,
        kind: n.kind,
        read: n.read,
        t: shortTime(n.at),
        at: n.at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

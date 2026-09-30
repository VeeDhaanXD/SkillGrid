const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      default: 'freelancer',
    },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },

    /* ---- shared profile ---- */
    headline: { type: String, default: '' },
    location: { type: String, default: '' },
    timezone: { type: String, default: '' },
    bio: { type: String, default: '' },
    memberSince: { type: String, default: '' },
    verified: {
      email: { type: Boolean, default: false },
      identity: { type: Boolean, default: false },
      payment: { type: Boolean, default: false },
    },

    /* ---- freelancer ---- */
    rate: { type: Number, default: 55 },
    availability: { type: String, default: 'Available' },
    hoursPerWeek: { type: Number, default: 30 },
    skills: [{ name: String, level: { type: Number, default: 80 } }],
    languages: [{ type: String }],
    education: [{ title: String, school: String, year: String }],
    certifications: [{ type: String }],
    links: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    portfolio: [{ title: String, tag: String, desc: String, stack: [String] }],
    responseTime: { type: String, default: '2h' },
    onTime: { type: Number, default: 98 },

    /* ---- client ---- */
    company: { type: String, default: '' },
    industry: { type: String, default: '' },
    companySize: { type: String, default: '' },
    website: { type: String, default: '' },
    founded: { type: String, default: '' },
    budgetRange: { type: String, default: '' },
    engagement: { type: String, default: 'Fixed-price' },
    categories: [{ type: String }],
    payment: {
      method: { type: String, default: '' },
      nextCharge: { type: String, default: '' },
    },
    team: [{ name: String, role: String, initials: String }],
    repeatClients: { type: Number, default: 40 },

    /* ---- wallet / standing ---- */
    rating: { type: Number, default: 5.0 },
    balance: { type: Number, default: 0 },
    escrowBalance: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

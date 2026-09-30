const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const raw = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!raw) throw new Error('MONGODB_URI is not set in .env');
    const uri = /mongodb(\+srv)?:\/\/[^/?]+$/.test(raw) ? `${raw}/skillgrid` : raw;
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

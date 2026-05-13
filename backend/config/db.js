const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGO_URI is not defined in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('✅  MongoDB Atlas Connected:', mongoose.connection.host);
  } catch (error) {
    console.error('❌  MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const URI = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(URI).then(async () => {
  const r = await Doctor.updateMany(
    { isVisible: { $exists: false } },
    { $set: { isVisible: true } }
  );
  console.log(`✅  Patched ${r.modifiedCount} doctors → isVisible: true`);

  const r2 = await Doctor.updateMany(
    { verificationStatus: { $exists: false } },
    { $set: { verificationStatus: 'pending' } }
  );
  console.log(`✅  Patched ${r2.modifiedCount} doctors → verificationStatus: pending`);

  const total = await Doctor.countDocuments({ isVisible: true });
  console.log(`📊  Total visible doctors: ${total}`);
  await mongoose.disconnect();
}).catch((e) => { console.error(e.message); process.exit(1); });

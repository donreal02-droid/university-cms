// backend/scripts/add2FAFields.js
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const add2FAFields = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/university_cms');
    console.log('Connected to MongoDB');

    // Update all users that don't have 2FA fields
    const result = await User.updateMany(
      { twoFactorEnabled: { $exists: false } },
      {
        $set: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorMethod: 'app',
          backupCodes: [],
          phoneVerified: false
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users`);
    console.log(`Matched ${result.matchedCount} users`);

    // Close connection
    await mongoose.connection.close();
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

add2FAFields();
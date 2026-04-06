import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { ROLES } from './src/utils/constants.js';

dotenv.config();

async function migrateOperators() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with role 'operator' (case-insensitive)
    const legacyUsers = await User.find({ 
      role: { $regex: /^operator$/i } 
    });

    console.log(`Found ${legacyUsers.length} users with legacy 'operator' role.`);

    if (legacyUsers.length === 0) {
      console.log('No migration needed.');
      process.exit(0);
    }

    // Update them to 'user' role
    const result = await User.updateMany(
      { role: { $regex: /^operator$/i } },
      { $set: { role: ROLES.USER } }
    );

    console.log(`✅ Successfully migrated ${result.modifiedCount} users to '${ROLES.USER}' role.`);
    
    // Optional: Log names of migrated users
    legacyUsers.forEach(u => {
      console.log(`- Migrated ${u.name} (${u.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateOperators();

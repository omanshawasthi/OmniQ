import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const existingAdmin = await User.findOne({ email: 'admin@queueless.com' });
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'Super Admin',
        email: 'admin@queueless.com',
        password: 'admin123', // Will be hashed by pre-save hook
        phone: '+1234567890',
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created: admin@queueless.com / admin123');
    } else {
      console.log('Admin already exists: admin@queueless.com (password is likely admin123)');
      // Check role just in case
      if(existingAdmin.role !== 'admin') {
          existingAdmin.role = 'admin';
          await existingAdmin.save();
          console.log('Fixed role to admin');
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();

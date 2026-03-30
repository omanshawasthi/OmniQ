import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './src/models/Branch.js';
import Department from './src/models/Department.js';

dotenv.config();

const seedMinimal = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Check if any active branch exists
    const existingBranch = await Branch.findOne({ isActive: true });
    
    if (!existingBranch) {
      console.log('No active branches found. Creating a default branch...');
      
      const defaultHours = { open: '09:00', close: '17:00', isClosed: false };
      const closedHours = { open: '00:00', close: '00:00', isClosed: true };
      
      const newBranch = await Branch.create({
        name: 'Main HQ Branch',
        address: '123 Enterprise Avenue, Tech District',
        phone: '1555010000',
        email: 'hq@queueless.com',
        operatingHours: {
          monday: defaultHours,
          tuesday: defaultHours,
          wednesday: defaultHours,
          thursday: defaultHours,
          friday: defaultHours,
          saturday: defaultHours,
          sunday: closedHours
        },
        isActive: true
      });

      console.log('Creating default departments...');
      await Department.create([
        {
          branchId: newBranch._id,
          name: 'Customer Support',
          description: 'General inquiries and support',
          averageServiceTime: 10,
          settings: {
            allowOnlineBooking: true,
            allowWalkIn: true,
            requireAuth: false,
            maxQueueSize: 50,
            tokenPrefix: 'C'
          },
          isActive: true
        },
        {
          branchId: newBranch._id,
          name: 'Technical Assistance',
          description: 'Technical troubleshooting and repairs',
          averageServiceTime: 25,
          settings: {
            allowOnlineBooking: true,
            allowWalkIn: true,
            requireAuth: false,
            maxQueueSize: 20,
            tokenPrefix: 'T'
          },
          isActive: true
        }
      ]);
      console.log('Seed completed successfully!');
    } else {
      console.log('Database already has active branches. Skipping minimal seed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedMinimal();

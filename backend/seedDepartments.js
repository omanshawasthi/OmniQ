import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Branch from './src/models/Branch.js';
import Department from './src/models/Department.js';

dotenv.config();

const DEPARTMENTS = [
  { name: 'Dental', icon: '🦷', prefix: 'DEN' },
  { name: 'ENT', icon: '👂', prefix: 'ENT' },
  { name: 'Orthopedic', icon: '🦴', prefix: 'ORT' },
  { name: 'General Medicine', icon: '🩺', prefix: 'GEN' },
  { name: 'Eye / Ophthalmology', icon: '👁️', prefix: 'EYE' },
  { name: 'Pediatrics', icon: '👶', prefix: 'PED' },
  { name: 'Dermatology', icon: '🧴', prefix: 'DER' },
  { name: 'Gynecology', icon: '🤰', prefix: 'GYN' }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for department patching...');

    const branches = await Branch.find({ isActive: true });
    console.log(`Found ${branches.length} active branches.`);

    for (const branch of branches) {
      console.log(`Checking departments for branch: ${branch.name}`);
      
      for (const dept of DEPARTMENTS) {
        const existing = await Department.findOne({
          branchId: branch._id,
          name: dept.name
        });

        if (!existing) {
          await Department.create({
            branchId: branch._id,
            name: dept.name,
            description: `${dept.name} services and consultations`,
            averageServiceTime: 15,
            icon: dept.icon,
            settings: {
              allowOnlineBooking: true,
              allowWalkIn: true,
              requireAuth: false,
              maxQueueSize: 100,
              tokenPrefix: dept.prefix
            },
            isActive: true
          });
          console.log(`+ Created ${dept.name} for ${branch.name}`);
        } else {
          console.log(`. ${dept.name} already exists for ${branch.name}`);
        }
      }
    }

    console.log('Department patch completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Patch error:', error);
    process.exit(1);
  }
};

seedDepartments();

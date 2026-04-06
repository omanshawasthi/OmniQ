import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';
import { COUNTER_STATUS } from '../utils/constants.js';

const kanpurLocalities = [
  {
    name: 'Kidwai Nagar Medical Hub',
    address: 'Kidwai Nagar, Kanpur, Uttar Pradesh 208011',
    phone: '+915122600001',
    email: 'kidwai@qfactor.com'
  },
  {
    name: 'Civil Lines Health Plaza',
    address: 'Civil Lines, Kanpur, Uttar Pradesh 208001',
    phone: '+915122300002',
    email: 'civillines@qfactor.com'
  },
  {
    name: 'Cantt Medical Center',
    address: 'Cantonment, Kanpur, Uttar Pradesh 208004',
    phone: '+915122400003',
    email: 'cantt@qfactor.com'
  },
  {
    name: 'Swaroop Nagar Care Point',
    address: 'Swaroop Nagar, Kanpur, Uttar Pradesh 208002',
    phone: '+915122500004',
    email: 'swaroop@qfactor.com'
  }
];

const medicalServices = [
  { name: 'General Medicine', avgTime: 10, icon: '🩺' },
  { name: 'Pediatrics', avgTime: 15, icon: '👶' },
  { name: 'Dental', avgTime: 20, icon: '🦷' },
  { name: 'ENT', avgTime: 12, icon: '👂' },
  { name: 'Orthopedic', avgTime: 18, icon: '🦴' },
  { name: 'Eye / Ophthalmology', avgTime: 15, icon: '👁️' },
  { name: 'Dermatology', avgTime: 12, icon: '🧴' },
  { name: 'Gynecology', avgTime: 20, icon: '👩‍⚕️' }
];

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/queueless';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Kanpur Seeding');
  } catch (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  }
};

const seedKanpur = async () => {
  try {
    await connectDB();

    console.log('--- Starting Kanpur Locality Seeding ---');

    for (const loc of kanpurLocalities) {
      // 1. Create/Update Branch
      let branch = await Branch.findOne({ name: loc.name });
      if (!branch) {
        branch = await Branch.create({
          ...loc,
          operatingHours: {
            monday: { open: '09:00', close: '20:00', isClosed: false },
            tuesday: { open: '09:00', close: '20:00', isClosed: false },
            wednesday: { open: '09:00', close: '20:00', isClosed: false },
            thursday: { open: '09:00', close: '20:00', isClosed: false },
            friday: { open: '09:00', close: '20:00', isClosed: false },
            saturday: { open: '09:00', close: '18:00', isClosed: false },
            sunday: { open: '10:00', close: '14:00', isClosed: false }
          }
        });
        console.log(`📍 Branch Created: ${branch.name}`);
      } else {
        console.log(`📍 Branch Exists: ${branch.name}`);
      }

      for (const service of medicalServices) {
        // 2. Create/Update Department
        let dept = await Department.findOne({ branchId: branch._id, name: service.name });
        if (!dept) {
          dept = await Department.create({
            name: service.name,
            branchId: branch._id,
            averageServiceTime: service.avgTime,
            icon: service.icon,
            isActive: true
          });
          console.log(`  🏢 Department Created: ${dept.name}`);
        } else {
          console.log(`  🏢 Department Exists: ${dept.name}`);
        }

        // 3. Create/Update Counter (Service Unit)
        // Naming pattern: "Locality Service Center"
        const localityPrefix = loc.name.split(' ')[0] + ' ' + (loc.name.split(' ')[1] || '');
        const counterName = `${localityPrefix} ${service.name} Center`.trim();
        
        let counter = await Counter.findOne({ branchId: branch._id, name: counterName });
        if (!counter) {
          counter = await Counter.create({
            name: counterName,
            branchId: branch._id,
            departmentId: dept._id,
            status: COUNTER_STATUS.OFFLINE,
            location: {
              floor: 'Ground Floor',
              section: service.name
            }
          });
          console.log(`    🔢 Counter Created: ${counter.name}`);
        } else {
          console.log(`    🔢 Counter Exists: ${counter.name}`);
        }
      }
    }

    console.log('\n✅ Kanpur Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seedKanpur();

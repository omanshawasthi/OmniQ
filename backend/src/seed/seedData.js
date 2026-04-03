import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Need to configure dotenv before importing models if models rely on env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User.js';
import Branch from '../models/Branch.js';
import Department from '../models/Department.js';
import Counter from '../models/Counter.js';

// Setup connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is extremely required to run this script.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for Seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  try {
    await connectDB();

    console.log('--- Starting Seed Process ---');

    // --- 1. ADMIN USER ---
    const adminData = { name: 'Admin User', email: 'admin@queueless.com', password: 'Admin@123', role: 'admin' };
    let admin = await User.findOne({ email: adminData.email });
    if (!admin) {
      admin = await User.create(adminData);
      console.log('✅ Admin created');
    } else {
      console.log('⏩ Admin already exists');
    }

    // --- 2. VISITORS / USERS ---
    const visitors = [
      { name: 'Aryan Mishra', email: 'aryan@queueless.com', password: 'User@123', role: 'user' },
      { name: 'Priya Sharma', email: 'priya@queueless.com', password: 'User@123', role: 'user' },
      { name: 'Ananya Gupta', email: 'ananya@queueless.com', password: 'User@123', role: 'user' },
      { name: 'Rohan Tiwari', email: 'rohan@queueless.com', password: 'User@123', role: 'user' },
      { name: 'Simran Kapoor', email: 'simran@queueless.com', password: 'User@123', role: 'user' }
    ];

    for (const vData of visitors) {
      let v = await User.findOne({ email: vData.email });
      if (!v) {
        await User.create(vData);
        console.log(`✅ Visitor created: ${vData.name}`);
      } else {
        console.log(`⏩ Visitor already exists: ${vData.name}`);
      }
    }

    // --- 3. OPERATORS ---
    const operatorDataList = [
      { name: 'Naman Verma', email: 'naman@queueless.com', password: 'User@123', role: 'operator' },
      { name: 'Omansh Awasthi', email: 'omansh@queueless.com', password: 'User@123', role: 'operator' },
      { name: 'Sachin Yadav', email: 'sachin@queueless.com', password: 'User@123', role: 'operator' },
      { name: 'Kartik Singh', email: 'kartik@queueless.com', password: 'User@123', role: 'operator' }
    ];
    let createdOperators = {};
    for (const op of operatorDataList) {
      let o = await User.findOne({ email: op.email });
      if (!o) {
        o = await User.create(op);
        console.log(`✅ Operator created: ${op.name}`);
      } else {
        console.log(`⏩ Operator already exists: ${op.name}`);
      }
      createdOperators[op.name] = o._id;
    }

    // --- 4. BRANCHES ---
    const branchList = [
      { name: 'Kanpur Central Hospital', code: 'KCH01', phone: '+919999999901', address: 'Kanpur City', email: 'kch@queueless.com', isActive: true },
      { name: 'Kakadeo Health Center', code: 'KHC02', phone: '+919999999902', address: 'Kakadeo, Kanpur', email: 'khc@queueless.com', isActive: true },
      { name: 'Govind Nagar Service Office', code: 'GNS03', phone: '+919999999903', address: 'Govind Nagar, Kanpur', email: 'gns@queueless.com', isActive: true }
    ];

    const departmentConfig = [
      { name: 'General OPD', averageServiceTime: 8 },
      { name: 'Cardiology', averageServiceTime: 12 },
      { name: 'Neurology', averageServiceTime: 15 },
      { name: 'Orthopedics', averageServiceTime: 10 },
      { name: 'Billing', averageServiceTime: 5 }
    ];

    for (const bData of branchList) {
      let branch = await Branch.findOne({ name: bData.name });
      if (!branch) {
        // Need to pass dummy valid data so validators don't fail
        branch = await Branch.create({
          ...bData,
          operatingHours: {
            monday: { open: '09:00', close: '18:00', isClosed: false },
            tuesday: { open: '09:00', close: '18:00', isClosed: false },
            wednesday: { open: '09:00', close: '18:00', isClosed: false },
            thursday: { open: '09:00', close: '18:00', isClosed: false },
            friday: { open: '09:00', close: '18:00', isClosed: false },
            saturday: { open: '09:00', close: '14:00', isClosed: false },
            sunday: { open: '00:00', close: '00:00', isClosed: true }
          }
        });
        console.log(`✅ Branch created: ${bData.name}`);
      } else {
        console.log(`⏩ Branch already exists: ${bData.name}`);
      }

      // Create a unique staff member for this branch
      const staffEmail = `staff_${bData.code.toLowerCase()}@queueless.com`;
      let staffUser = await User.findOne({ email: staffEmail });
      if (!staffUser) {
        staffUser = await User.create({
          name: `Reception Staff - ${bData.code}`,
          email: staffEmail,
          password: 'Staff@123',
          role: 'staff',
          assignedBranch: branch._id
        });
        console.log(`✅ Staff created: ${staffUser.name}`);
      } else {
        console.log(`⏩ Staff already exists: ${staffUser.name}`);
      }

      // Create departments for this branch
      let branchDepts = {};
      for (const dData of departmentConfig) {
        let dept = await Department.findOne({ branchId: branch._id, name: dData.name });
        if (!dept) {
          dept = await Department.create({ ...dData, branchId: branch._id, isActive: true });
          console.log(`  ✅ Department created: ${dData.name} (${bData.name})`);
        } else {
          console.log(`  ⏩ Department already exists: ${dData.name} (${bData.name})`);
        }
        branchDepts[dData.name] = dept;
      }

      // Create counters for this branch
      let counterConfigs = [];
      if (bData.name.includes('Hospital') || bData.name.includes('Health')) {
        counterConfigs = [
          { name: 'OPD Counter 1', deptName: 'General OPD', operatorName: 'Naman Verma' },
          { name: 'OPD Counter 2', deptName: 'General OPD', operatorName: 'Omansh Awasthi' },
          { name: 'Cardiology Desk', deptName: 'Cardiology', operatorName: 'Sachin Yadav' },
          { name: 'Billing Counter', deptName: 'Billing', operatorName: 'Kartik Singh' }
        ];
      } else {
        counterConfigs = [
          { name: 'Registration Desk', deptName: 'General OPD' },
          { name: 'Document Verification', deptName: 'Orthopedics' },
          { name: 'Payment Counter', deptName: 'Billing' }
        ];
      }

      for (const cData of counterConfigs) {
        // Need to ensure the associated department exists in our dictionary
        const deptId = branchDepts[cData.deptName]._id;
        
        // Counter name must be unique per branchId according to standard schematic
        let ctr = await Counter.findOne({ branchId: branch._id, name: cData.name });
        if (!ctr) {
          ctr = await Counter.create({
            name: cData.name,
            branchId: branch._id,
            departmentId: deptId,
            status: 'active',
            assignedOperator: cData.operatorName ? createdOperators[cData.operatorName] : null
          });
          
          if (cData.operatorName) {
            // Let's also stamp the user record so they know which branch/counter they belong to
            await User.findByIdAndUpdate(createdOperators[cData.operatorName], {
              assignedBranch: branch._id,
              assignedCounter: ctr._id
            });
          }

          console.log(`    ✅ Counter created: ${cData.name} -> Assigned: ${cData.operatorName || 'None'}`);
        } else {
          console.log(`    ⏩ Counter already exists: ${cData.name}`);
        }
      }
    }

    console.log('\n✅ Seeding Complete! The database is primed and ready to rock.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

runSeed();

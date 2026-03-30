import { connectDB } from './src/config/database.js';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const promoteLatestUser = async () => {
  try {
    await connectDB();
    const latestUser = await User.findOne().sort({ createdAt: -1 });
    
    if (latestUser) {
      latestUser.role = 'ADMIN'; // ADMIN role gives access to everything
      await latestUser.save();
      console.log(`\n✅ Successfully promoted ${latestUser.email} to ADMIN!`);
      console.log(`You now have full access. Please log out and sign back in to apply the changes.\n`);
    } else {
      console.log('\n❌ No users found in the database. Please register first.\n');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  }
};

promoteLatestUser();

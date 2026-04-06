import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const coll = mongoose.connection.db.collection('departments');
    const indexes = await coll.indexes();
    for (const idx of indexes) {
      if (idx.name !== '_id_' && idx.name !== 'branchId_1_name_1') {
        console.log('Dropping index:', idx.name);
        await coll.dropIndex(idx.name).catch(e => console.error('Failed to drop', idx.name, e.message));
      }
    }
    const result = await coll.deleteMany({ branchId: { $exists: false } });
    console.log('Deleted', result.deletedCount, 'orphaned dpts');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
cleanup();

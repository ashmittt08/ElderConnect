import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function approveAll() {
  await mongoose.connect(mongoUri);
  const result = await mongoose.connection.db.collection('users').updateMany({}, { $set: { approved: true } });
  console.log(`✅ ALL USERS APPROVED! Modified: ${result.modifiedCount}`);
  process.exit(0);
}

approveAll().catch(err => {
  console.error(err);
  process.exit(1);
});

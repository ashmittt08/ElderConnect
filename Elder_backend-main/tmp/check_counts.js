import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function checkCounts() {
  await mongoose.connect(process.env.MONGO_URI);
  const requests = await mongoose.connection.db.collection('requests').countDocuments({ status: 'pending' });
  const deliveries = await mongoose.connection.db.collection('deliveryorders').countDocuments({ status: 'pending' });
  console.log(`PENDING REQUESTS: ${requests}`);
  console.log(`PENDING DELIVERIES: ${deliveries}`);
  process.exit(0);
}
checkCounts();

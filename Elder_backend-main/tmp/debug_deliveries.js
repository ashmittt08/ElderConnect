import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function debugDeliveries() {
  await mongoose.connect(process.env.MONGO_URI);
  const orders = await mongoose.connection.db.collection('deliveryorders').find({ status: 'pending' }).toArray();
  console.log('PENDING ORDERS:', JSON.stringify(orders, null, 2));
  process.exit(0);
}
debugDeliveries();

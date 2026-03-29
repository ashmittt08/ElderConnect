import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const ngos = await User.find({ role: 'ngo' });
  console.log('NGOS IN DB:', JSON.stringify(ngos.map(n => ({
    name: n.name,
    address: n.address,
    approved: n.approved,
    role: n.role
  })), null, 2));
  process.exit(0);
}

check();

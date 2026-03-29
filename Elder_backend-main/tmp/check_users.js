const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  address: String,
  approved: Boolean,
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const users = await User.find({}, 'name email role address approved');
    console.log('USERS IN DB:', JSON.stringify(users, null, 2));
    process.exit(0);
  });

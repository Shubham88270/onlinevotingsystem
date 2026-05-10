require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://votechain-user:so2HtUgMRfBt5wbe@votechain-user.gxkfwgn.mongodb.net/votechain?retryWrites=true&w=majority';

async function debug() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  const user = await mongoose.connection.db
    .collection('users')
    .findOne({ email: 'admin@vote.com' });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log('User found:');
  console.log('  isAdmin:',    user.isAdmin);
  console.log('  isVerified:', user.isVerified);
  console.log('  isApproved:', user.isApproved);
  console.log('  password hash:', user.password?.slice(0, 20) + '...');

  // Test password match
  const match = await bcrypt.compare('Admin@123', user.password);
  console.log('  Password "Admin@123" matches:', match);

  process.exit(0);
}

debug().catch(e => { console.error(e.message); process.exit(1); });

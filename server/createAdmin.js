require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI ||
  'mongodb+srv://votechain-user:so2HtUgMRfBt5wbe@votechain-user.gxkfwgn.mongodb.net/votechain?retryWrites=true&w=majority';

async function createAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // Hash password manually (same as bcrypt rounds=10 in User model)
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
    { email: 'admin@vote.com' },
    {
      $set: {
        name:       'Admin',
        password:   hashedPassword,  // properly hashed
        isAdmin:    true,
        isVerified: true,
        isApproved: true,
      },
      $setOnInsert: {
        email:          'admin@vote.com',
        voterId:        'VOTER-00001',
        photo:          '',
        branch:         '',
        college:        '',
        university:     '',
        rollNo:         '',
        phone:          '',
        votedElections: [],
        createdAt:      new Date(),
        updatedAt:      new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  console.log('✅ Admin ready!');
  console.log('📧 Email:    admin@vote.com');
  console.log('🔑 Password: Admin@123');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

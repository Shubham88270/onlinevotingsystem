const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isAdmin:  { type: Boolean, default: false },

    // Voter specific
    voterId:    { type: String, unique: true, sparse: true },
    photo:      { type: String, default: '' },

    // Academic details
    branch:     { type: String, default: '' },
    college:    { type: String, default: '' },
    university: { type: String, default: '' },
    rollNo:     { type: String, default: '', index: { unique: true, sparse: true, partialFilterExpression: { rollNo: { $gt: '' } } } },

    // Contact
    phone:      { type: String, default: '', index: { unique: true, sparse: true, partialFilterExpression: { phone: { $gt: '' } } } },
    phoneVerified: { type: Boolean, default: false },

    // Phone OTP
    phoneOtp:       { type: String, default: null },
    phoneOtpExpiry: { type: Date,   default: null },

    // Status
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },

    votedElections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Election' }],

    // Email verification token
    verificationToken:  { type: String, default: null },
    verificationExpiry: { type: Date,   default: null },

    // OTP for admin-registered users
    otp:         { type: String,  default: null },
    otpExpiry:   { type: Date,    default: null },
    otpResendAt: { type: Date,    default: null }, // cooldown: can resend after this time

    // TTL: auto-delete unverified users after 10 minutes
    // This field is only set for unverified users; cleared on verification
    unverifiedExpiry: { type: Date, default: null, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.voterId) {
    // Keep trying until we get a unique voterId
    let voterId;
    let attempts = 0;
    while (true) {
      attempts++;
      const count   = await mongoose.model('User').countDocuments();
      const suffix  = String(count + attempts + Math.floor(Math.random() * 50)).padStart(5, '0');
      voterId       = `VOTER-${suffix}`;
      const exists  = await mongoose.model('User').findOne({ voterId });
      if (!exists) break;
    }
    this.voterId = voterId;
  }
  next();
});

userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);

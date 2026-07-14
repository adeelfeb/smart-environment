import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: false,
      unique: true, 
      sparse: true, // Allows multiple null/undefined values while enforcing uniqueness for actual emails
      lowercase: true, 
      trim: true 
    },
    username: { 
      type: String, 
      unique: true,
      sparse: true, // Allows null values but enforces uniqueness when present
      trim: true,
      lowercase: true,
      index: true 
    },
    password: { type: String, required: true, minlength: 5 },
    role: { type: String, default: 'base_user', index: true },
    /**
     * Optional pointer to a role document.
     * Enables future migration to managed roles without breaking existing data.
     */
    roleRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    // Email verification fields
    isEmailVerified: { type: Boolean, default: false, index: true },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    // Account status - when true, user cannot login
    isPaused: { type: Boolean, default: false, index: true },
    // Valentine links: how many links the user can still create (base users start with 1)
    valentineCredits: { type: Number, default: 1, min: 0 },
    // Valentine email resends: base users get 1 free resend per link, then use these credits
    valentineEmailCredits: { type: Number, default: 0, min: 0 },
    // Corporation assignment for admin users
    corporation: { type: mongoose.Schema.Types.ObjectId, ref: 'Corporation', default: null },
    phone: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Hash password before save if modified
UserSchema.pre('save', async function (next) {
  // Defensive check for next function
  if (!next || typeof next !== 'function') {
    // If next is not a function, handle synchronously
    if (this.isModified('password')) {
      try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      } catch (error) {
        console.error('Error hashing password:', error);
        throw error;
      }
    }
    return;
  }

  // Normal hook execution with next callback
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);
export default User;



import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin", "tenant_admin", "tenant_staff", "customer"],
      default: "user",
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lockReason: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null
    },
    // Add these missing fields
    verificationToken: {
      type: String,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate verification token before saving new user
userSchema.pre('save', function (next) {
  if (this.isNew && !this.verificationToken) {
    // Generate 6-digit verification code
    this.verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    this.verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
  }
  next();
});

export default mongoose.model("User", userSchema);

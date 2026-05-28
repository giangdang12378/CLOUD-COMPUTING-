import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a store name"],
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Please provide a contact email"],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lockReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Tenant", tenantSchema);

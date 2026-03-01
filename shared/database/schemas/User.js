const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

/** Returns public-safe user object (no password) */
userSchema.methods.toDTO = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
  };
};

module.exports = userSchema;

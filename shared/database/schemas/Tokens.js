const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, required: true },
  },
  { timestamps: true }
);

// One token document per user; replace on refresh
tokenSchema.index({ user: 1 }, { unique: true });

module.exports = tokenSchema;

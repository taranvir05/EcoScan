const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    avatarColor: {
      type: String,
      default: "bg-primary",
    },
    language: {
      type: String,
      default: "English",
    },
    preferredDashboard: {
      type: String,
      default: "Default",
    },
    layoutDensity: {
      type: String,
      default: "Spacious",
    },
    themePreference: {
      type: String,
      default: "Dark",
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      default: "user", // user | admin
    },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);
console.log("[DB] User model initialized");
module.exports = User;
const User = require("../models/user");
const Result = require("../models/Result");
const Activity = require("../models/Activity");
const bcrypt = require("bcryptjs");

// GET PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatarColor, language, preferredDashboard, layoutDensity, themePreference, notifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (avatarColor !== undefined) user.avatarColor = avatarColor;
    if (language !== undefined) user.language = language;
    if (preferredDashboard !== undefined) user.preferredDashboard = preferredDashboard;
    if (layoutDensity !== undefined) user.layoutDensity = layoutDensity;
    if (themePreference !== undefined) user.themePreference = themePreference;
    if (notifications !== undefined) user.notifications = notifications;

    await user.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      type: "profile",
      text: "Updated profile preferences"
    });

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE PASSWORD
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Log Activity
    await Activity.create({
      user: req.user.id,
      type: "security",
      text: "Changed account password"
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET USER STATS
exports.getUserStats = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user.id }).sort({ createdAt: -1 });
    const totalScans = results.length;
    let totalDetections = 0;
    let totalConfidence = 0;
    const categoryCounts = {};

    results.forEach(r => {
      totalDetections += r.totalDetections || 0;
      r.detections.forEach(d => {
        totalConfidence += d.confidence || 0;
        categoryCounts[d.type] = (categoryCounts[d.type] || 0) + 1;
      });
    });

    const categories = Object.keys(categoryCounts);
    const mostCommonType = categories.length > 0 
      ? categories.reduce((a, b) => categoryCounts[a] > categoryCounts[b] ? a : b) 
      : "None";

    const avgConfidence = totalDetections > 0 ? Math.round(totalConfidence / totalDetections) : 0;

    // Eco Impact Estimates
    const impactSummary = {
      landfillSaved: totalDetections * 0.5, // kg
      recyclingPotential: Math.round((categoryCounts["Plastic"] || 0) + (categoryCounts["Metal"] || 0) + (categoryCounts["Glass"] || 0)),
      carbonOffset: totalScans * 1.2, // kg CO2
    };

    const ecoScore = Math.min(100, Math.round((totalScans * 5) + (totalDetections * 2)));

    res.json({
      totalScans,
      totalDetections,
      avgConfidence,
      mostCommonType,
      impactSummary,
      ecoScore,
      hasUsedChat: false,
      latestScan: results[0] || null
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// GET ACTIVITY
exports.getUserActivity = async (req, res) => {
  try {
    const activity = await Activity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// EXPORT DATA
exports.exportUserData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    const results = await Result.find({ user: req.user.id });

    const exportData = {
      profile: user,
      scans: results,
      exportedAt: new Date(),
      platform: "EcoScan AI"
    };

    // Log Activity
    await Activity.create({
      user: req.user.id,
      type: "report",
      text: "Exported personal data report"
    });

    res.json(exportData);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE ACCOUNT
exports.deleteAccount = async (req, res) => {
  try {
    await Result.deleteMany({ user: req.user.id });
    await Activity.deleteMany({ user: req.user.id });
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: "Account and all associated data deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

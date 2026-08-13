const User = require("../models/user");
const Result = require("../models/Result");
const mongoose = require("mongoose");

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res) => {
  console.log(">>> [ADMIN] Fetching dashboard stats...");
  try {
    const totalUsers = await User.countDocuments();
    const totalScans = await Result.countDocuments();
    
    // Total detections across all scans
    const totalDetectionsAgg = await Result.aggregate([
      { $group: { _id: null, total: { $sum: "$totalDetections" } } }
    ]);
    const totalDetections = totalDetectionsAgg[0]?.total || 0;

    // Today's scans
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayScans = await Result.countDocuments({ createdAt: { $gte: today } });

    // This month's scans
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthScans = await Result.countDocuments({ createdAt: { $gte: firstDayOfMonth } });

    console.log(`>>> [ADMIN] Basic stats: Users=${totalUsers}, Scans=${totalScans}, Detections=${totalDetections}`);

    // Waste type distribution
    const wasteDistribution = await Result.aggregate([
      { $match: { detections: { $exists: true, $ne: [] } } },
      { $unwind: "$detections" },
      { $group: { _id: "$detections.type", count: { $sum: 1 } } }
    ]);

    // Average confidence
    const avgConfidenceAgg = await Result.aggregate([
      { $match: { detections: { $exists: true, $ne: [] } } },
      { $unwind: "$detections" },
      { $group: { _id: null, avgConf: { $avg: "$detections.confidence" } } }
    ]);
    const avgConfidence = avgConfidenceAgg[0]?.avgConf || 0;

    // Most detected waste
    const sortedWaste = [...wasteDistribution].sort((a, b) => b.count - a.count);
    const mostDetected = sortedWaste[0]?._id || "None";

    console.log(">>> [ADMIN] Stats aggregation complete.");

    res.json({
      totalUsers,
      totalScans,
      totalDetections,
      todayScans,
      monthScans,
      avgConfidence: Math.round(avgConfidence),
      mostDetected,
      wasteDistribution: wasteDistribution.map(item => ({
        name: item._id,
        value: item.count
      }))
    });
  } catch (error) {
    console.error(">>> [ADMIN ERROR] Stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

// @desc    Get Analytics Chart Data
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalyticsData = async (req, res) => {
  console.log(">>> [ADMIN] Fetching analytics data...");
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uploadsTrend = await Result.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    console.log(">>> [ADMIN] Analytics data complete.");

    res.json({
      uploadsTrend: uploadsTrend.map(item => ({ date: item._id, count: item.count })),
      userGrowth: userGrowth.map(item => ({ month: item._id, count: item.count }))
    });
  } catch (error) {
    console.error(">>> [ADMIN ERROR] Analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics data", error: error.message });
  }
};

// @desc    Get All Users (Management)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  console.log(">>> [ADMIN] Fetching all users...");
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const uploadCount = await Result.countDocuments({ user: user._id });
      return {
        ...user._doc,
        uploadCount
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error(">>> [ADMIN ERROR] Users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// @desc    Update User Role/Status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (role) user.role = role;
    
    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Failed to update user" });
  }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Result.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and associated data deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// @desc    Get Recent Scans
// @route   GET /api/admin/scans
// @access  Private/Admin
exports.getRecentScans = async (req, res) => {
  console.log(">>> [ADMIN] Fetching recent scans...");
  try {
    const scans = await Result.find()
      .populate("user", "email")
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json(scans);
  } catch (error) {
    console.error(">>> [ADMIN ERROR] Scans:", error);
    res.status(500).json({ message: "Failed to fetch scans" });
  }
};

// @desc    Get System Insights
// @route   GET /api/admin/insights
// @access  Private/Admin
exports.getSystemInsights = async (req, res) => {
  console.log(">>> [ADMIN] Fetching insights...");
  try {
    const insights = [];
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const plasticCount = await Result.countDocuments({
      createdAt: { $gte: lastWeek },
      "detections.type": { $regex: /^plastic$/i }
    });

    if (plasticCount > 10) {
      insights.push({
        type: "trend",
        text: "Plastic detections are trending high this week.",
        priority: "high"
      });
    }

    const lowConfidenceCount = await Result.countDocuments({
      "detections.confidence": { $lt: 50 }
    });

    if (lowConfidenceCount > 5) {
      insights.push({
        type: "warning",
        text: `Detected ${lowConfidenceCount} scans with low confidence. Review AI accuracy.`,
        priority: "medium"
      });
    }

    const newUserCount = await User.countDocuments({ createdAt: { $gte: lastWeek } });
    if (newUserCount > 0) {
      insights.push({
        type: "growth",
        text: `${newUserCount} new eco-warriors joined in the last 7 days!`,
        priority: "low"
      });
    }

    res.json(insights);
  } catch (error) {
    console.error(">>> [ADMIN ERROR] Insights:", error);
    res.status(500).json({ message: "Failed to fetch insights" });
  }
};



const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const {
  getAdminStats,
  getAnalyticsData,
  getAllUsers,
  updateUser,
  deleteUser,
  getRecentScans,
  getSystemInsights
} = require("../controllers/adminController");

// All routes are protected and admin only
router.use(protect);
router.use(adminOnly);

router.get("/stats", getAdminStats);
router.get("/analytics", getAnalyticsData);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/scans", getRecentScans);
router.get("/insights", getSystemInsights);

module.exports = router;

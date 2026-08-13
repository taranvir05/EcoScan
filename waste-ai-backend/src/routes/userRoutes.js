const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, userController.updateProfile);
router.put("/password", protect, userController.updatePassword);
router.get("/stats", protect, userController.getUserStats);
router.get("/activity", protect, userController.getUserActivity);
router.get("/export", protect, userController.exportUserData);
router.delete("/", protect, userController.deleteAccount);

module.exports = router;

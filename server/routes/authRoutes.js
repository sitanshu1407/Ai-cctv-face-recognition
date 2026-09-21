const express = require("express");
const router = express.Router();
const { register, login, getMe, changePassword, getSettings, updateSettings } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

router.route("/settings")
  .get(protect, getSettings)
  .post(protect, updateSettings);

module.exports = router;

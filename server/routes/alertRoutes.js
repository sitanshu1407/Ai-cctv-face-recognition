const express = require("express");
const router = express.Router();
const { getAlerts, markAlertRead, deleteAlert, getStatistics } = require("../controllers/alertController");
const { protect } = require("../middleware/auth");

router.get("/", protect, getAlerts);
router.get("/statistics", protect, getStatistics);
router.put("/:id/read", protect, markAlertRead);
router.delete("/:id", protect, deleteAlert);

module.exports = router;

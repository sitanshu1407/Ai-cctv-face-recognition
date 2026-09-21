const express = require("express");
const router = express.Router();
const { downloadPDFReport, downloadExcelReport, downloadCSVReport } = require("../controllers/reportsController");
const { protect } = require("../middleware/auth");

router.get("/pdf", protect, downloadPDFReport);
router.get("/excel", protect, downloadExcelReport);
router.get("/csv", protect, downloadCSVReport);

module.exports = router;

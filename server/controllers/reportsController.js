const Alert = require("../models/Alert");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Helper to fetch filtered alerts
const fetchAlertsData = async (filters) => {
  const query = {};
  if (filters.camera) query.camera = filters.camera;
  if (filters.status) query.status = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  return await Alert.find(query).populate("camera", "name url type").sort({ createdAt: -1 });
};

// @desc    Download PDF Report of Alerts
// @route   GET /api/reports/pdf
// @access  Private
const downloadPDFReport = async (req, res) => {
  try {
    const alerts = await fetchAlertsData(req.query);

    const doc = new PDFDocument({ margin: 30 });
    
    // Set headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=security_report.pdf");
    
    doc.pipe(res);

    // Title
    doc.fontSize(20).text("Smart Home Security System - Incident Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "right" });
    doc.text(`Total Incidents Logged: ${alerts.length}`, { align: "right" });
    doc.moveDown(2);

    // Table Header
    doc.fontSize(12).font("Helvetica-Bold");
    doc.text("Timestamp", 30, 150);
    doc.text("Camera Name", 180, 150);
    doc.text("Person Name", 300, 150);
    doc.text("Confidence", 420, 150);
    doc.text("Status", 500, 150);
    
    doc.moveTo(30, 165).lineTo(570, 165).stroke();
    doc.moveDown();

    // Table Rows
    doc.font("Helvetica").fontSize(10);
    let y = 175;

    alerts.forEach((alert) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("Timestamp", 30, y);
        doc.text("Camera Name", 180, y);
        doc.text("Person Name", 300, y);
        doc.text("Confidence", 420, y);
        doc.text("Status", 500, y);
        doc.moveTo(30, y + 15).lineTo(570, y + 15).stroke();
        doc.font("Helvetica").fontSize(10);
        y += 25;
      }

      const timestamp = new Date(alert.createdAt).toLocaleString();
      const cameraName = alert.camera ? alert.camera.name : "Unknown";
      const personName = alert.personName;
      const confidence = `${(alert.confidence * 100).toFixed(0)}%`;
      const status = alert.status.toUpperCase();

      doc.text(timestamp, 30, y);
      doc.text(cameraName, 180, y);
      doc.text(personName, 300, y);
      doc.text(confidence, 420, y);
      doc.text(status, 500, y);
      
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Error generating report" });
    }
  }
};

// @desc    Download Excel Report of Alerts
// @route   GET /api/reports/excel
// @access  Private
const downloadExcelReport = async (req, res) => {
  try {
    const alerts = await fetchAlertsData(req.query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Security Alerts");

    worksheet.columns = [
      { header: "ID", key: "id", width: 30 },
      { header: "Timestamp", key: "timestamp", width: 25 },
      { header: "Camera Name", key: "cameraName", width: 20 },
      { header: "Camera URL/Path", key: "cameraUrl", width: 25 },
      { header: "Detected Identity", key: "personName", width: 20 },
      { header: "Confidence Score", key: "confidence", width: 18 },
      { header: "Status", key: "status", width: 12 },
    ];

    // Format headers
    worksheet.getRow(1).font = { bold: true };

    alerts.forEach((alert) => {
      worksheet.addRow({
        id: alert._id.toString(),
        timestamp: new Date(alert.createdAt).toLocaleString(),
        cameraName: alert.camera ? alert.camera.name : "Unknown",
        cameraUrl: alert.camera ? alert.camera.url : "N/A",
        personName: alert.personName,
        confidence: `${(alert.confidence * 100).toFixed(0)}%`,
        status: alert.status,
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=security_report.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Error generating Excel report" });
    }
  }
};

// @desc    Download CSV Report of Alerts
// @route   GET /api/reports/csv
// @access  Private
const downloadCSVReport = async (req, res) => {
  try {
    const alerts = await fetchAlertsData(req.query);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=security_report.csv");

    // CSV headers
    let csvContent = "Alert ID,Timestamp,Camera Name,Detected Person,Confidence,Status\n";

    alerts.forEach((alert) => {
      const id = alert._id.toString();
      const timestamp = `"${new Date(alert.createdAt).toLocaleString()}"`;
      const cameraName = `"${alert.camera ? alert.camera.name : "Unknown"}"`;
      const personName = `"${alert.personName}"`;
      const confidence = `"${(alert.confidence * 100).toFixed(0)}%"`;
      const status = `"${alert.status}"`;
      
      csvContent += `${id},${timestamp},${cameraName},${personName},${confidence},${status}\n`;
    });

    res.send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error generating CSV report" });
  }
};

module.exports = {
  downloadPDFReport,
  downloadExcelReport,
  downloadCSVReport,
};

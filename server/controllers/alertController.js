const Alert = require("../models/Alert");
const Camera = require("../models/Camera");
const Face = require("../models/Face");
const fs = require("fs");
const path = require("path");

// @desc    Get all alerts with filtering and pagination
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by camera
    if (req.query.camera) {
      query.camera = req.query.camera;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by search query (person name)
    if (req.query.search) {
      query.personName = { $regex: req.query.search, $options: "i" };
    }

    const total = await Alert.countDocuments(query);

    const alerts = await Alert.find(query)
      .populate("camera", "name url type")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: alerts.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
// @access  Private
const markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    alert.status = "read";
    await alert.save();

    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an alert
// @route   DELETE /api/alerts/:id
// @access  Private
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    // Delete associated files
    if (alert.screenshotPath) {
      const fullScreenshotPath = path.resolve(alert.screenshotPath);
      if (fs.existsSync(fullScreenshotPath)) {
        fs.unlinkSync(fullScreenshotPath);
      }
    }

    if (alert.videoPath) {
      const fullVideoPath = path.resolve(alert.videoPath);
      if (fs.existsSync(fullVideoPath)) {
        fs.unlinkSync(fullVideoPath);
      }
    }

    await Alert.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics / statistics
// @route   GET /api/alerts/statistics
// @access  Private
const getStatistics = async (req, res) => {
  try {
    // 1. Cameras metrics
    const totalCameras = await Camera.countDocuments({});
    const onlineCameras = await Camera.countDocuments({ status: "online", isActive: true });
    const offlineCameras = totalCameras - onlineCameras;

    // 2. Face metrics
    const totalFaces = await Face.countDocuments({});

    // 3. Alerts metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const alertsToday = await Alert.countDocuments({
      createdAt: { $gte: startOfToday },
    });
    
    const unreadAlerts = await Alert.countDocuments({ status: "unread" });

    // 4. Recent alerts
    const recentAlerts = await Alert.find({})
      .populate("camera", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. Activity data (alerts by date for a chart - last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await Alert.countDocuments({
        createdAt: { $gte: start, $lte: end },
      });

      chartData.push({
        date: start.toLocaleDateString("en-US", { weekday: "short" }),
        alerts: count,
      });
    }

    res.json({
      success: true,
      data: {
        cameras: {
          total: totalCameras,
          online: onlineCameras,
          offline: offlineCameras,
        },
        faces: {
          total: totalFaces,
        },
        alerts: {
          today: alertsToday,
          unread: unreadAlerts,
        },
        recentAlerts,
        chartData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAlerts,
  markAlertRead,
  deleteAlert,
  getStatistics,
};

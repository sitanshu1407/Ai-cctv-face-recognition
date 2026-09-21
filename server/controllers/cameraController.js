const Camera = require("../models/Camera");
const axios = require("axios");

// Helper to notify Python AI service of camera updates
const notifyAIService = async () => {
  try {
    const aiUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    await axios.post(`${aiUrl}/api/cameras/reload`);
  } catch (error) {
    console.error(`Failed to notify AI service of camera update: ${error.message}`);
  }
};

// @desc    Get all cameras
// @route   GET /api/cameras
// @access  Private
const getCameras = async (req, res) => {
  try {
    const cameras = await Camera.find({});
    res.json({ success: true, count: cameras.length, data: cameras });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single camera
// @route   GET /api/cameras/:id
// @access  Private
const getCameraById = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, message: "Camera not found" });
    }
    res.json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new camera
// @route   POST /api/cameras
// @access  Private
const createCamera = async (req, res) => {
  const { name, url, type } = req.body;

  try {
    if (!name || !url) {
      return res.status(400).json({ success: false, message: "Please provide camera name and connection URL" });
    }

    const camera = await Camera.create({
      name,
      url,
      type: type || "webcam",
      status: "offline",
      isActive: true,
    });

    await notifyAIService();

    res.status(201).json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update camera
// @route   PUT /api/cameras/:id
// @access  Private
const updateCamera = async (req, res) => {
  try {
    let camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, message: "Camera not found" });
    }

    camera = await Camera.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    await notifyAIService();

    res.json({ success: true, data: camera });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete camera
// @route   DELETE /api/cameras/:id
// @access  Private
const deleteCamera = async (req, res) => {
  try {
    const camera = await Camera.findById(req.params.id);
    if (!camera) {
      return res.status(404).json({ success: false, message: "Camera not found" });
    }

    await Camera.findByIdAndDelete(req.params.id);

    await notifyAIService();

    res.json({ success: true, message: "Camera deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCameras,
  getCameraById,
  createCamera,
  updateCamera,
  deleteCamera,
};

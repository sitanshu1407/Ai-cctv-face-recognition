const Face = require("../models/Face");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Helper to notify Python AI service to update its face embeddings cache
const notifyAIServiceFacesReload = async () => {
  try {
    const aiUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    await axios.post(`${aiUrl}/api/faces/reload`);
  } catch (error) {
    console.error(`Failed to notify AI service of faces update: ${error.message}`);
  }
};

// @desc    Register a new face (Family Member)
// @route   POST /api/faces
// @access  Private
const registerFace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      // Cleanup uploaded files if name is missing
      if (req.files) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ success: false, message: "Please provide a name for the person" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "Please upload at least one image" });
    }

    // Check if name already exists
    const faceExists = await Face.findOne({ name });
    if (faceExists) {
      if (req.files) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res.status(400).json({ success: false, message: "A person with this name is already registered" });
    }

    const imagePaths = req.files.map((file) => file.path.replace(/\\/g, "/"));
    
    // We send the path of the first image to Python to generate the embedding
    // In production, we could average the embeddings if there are multiple images, 
    // or just take the first one. Let's take the first one or average them.
    // Let's send the first image's absolute path to the Python AI service
    const absoluteImagePath = path.resolve(req.files[0].path).replace(/\\/g, "/");
    
    const aiUrl = process.env.PYTHON_AI_SERVICE_URL || "http://localhost:8000";
    let embedding;

    try {
      const response = await axios.post(`${aiUrl}/api/extract-embedding`, {
        image_path: absoluteImagePath,
      });

      if (response.data && response.data.success) {
        embedding = response.data.embedding;
      } else {
        throw new Error(response.data.message || "Failed to extract embedding");
      }
    } catch (error) {
      // Cleanup files on AI service failure
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      console.error(`AI Service error: ${error.message}`);
      return res.status(502).json({ 
        success: false, 
        message: `AI Face Recognition Service is offline or failed. Error: ${error.message}` 
      });
    }

    const newFace = await Face.create({
      name,
      images: imagePaths,
      embedding,
    });

    // Notify AI service to reload face cache
    await notifyAIServiceFacesReload();

    res.status(201).json({ success: true, data: newFace });
  } catch (error) {
    if (req.files) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered faces
// @route   GET /api/faces
// @access  Private
const getFaces = async (req, res) => {
  try {
    const faces = await Face.find({}).select("-embedding"); // Exclude embedding from normal retrieval
    res.json({ success: true, count: faces.length, data: faces });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a registered face
// @route   DELETE /api/faces/:id
// @access  Private
const deleteFace = async (req, res) => {
  try {
    const face = await Face.findById(req.params.id);
    if (!face) {
      return res.status(404).json({ success: false, message: "Face profile not found" });
    }

    // Delete local files
    face.images.forEach((imgPath) => {
      const fullPath = path.resolve(imgPath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });

    await Face.findByIdAndDelete(req.params.id);

    // Notify AI service to reload face cache
    await notifyAIServiceFacesReload();

    res.json({ success: true, message: "Face profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerFace,
  getFaces,
  deleteFace,
};

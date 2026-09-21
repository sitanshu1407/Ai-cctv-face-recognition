const express = require("express");
const router = express.Router();
const { getCameras, getCameraById, createCamera, updateCamera, deleteCamera } = require("../controllers/cameraController");
const { protect } = require("../middleware/auth");

router.route("/")
  .get(protect, getCameras)
  .post(protect, createCamera);

router.route("/:id")
  .get(protect, getCameraById)
  .put(protect, updateCamera)
  .delete(protect, deleteCamera);

module.exports = router;

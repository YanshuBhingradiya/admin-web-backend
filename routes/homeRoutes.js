const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const controller = require("../controllers/homeController");


// =============================
// Project CRUD
// =============================

// Create project
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 20 },      // allow more images
    { name: "floorPlans", maxCount: 10 }
  ]),
  controller.createProject
);


// Get project count
router.get("/count", controller.getProjectsCount);


// Get houses of a project
router.get("/houses/:projectId", controller.getProjectHouseList);


// Get all projects
router.get("/", controller.getProjects);


// Get single project
router.get("/:id", controller.getProject);


// Update project
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 20 },
    { name: "floorPlans", maxCount: 10 }
  ]),
  controller.updateProject
);


// Delete project
router.delete("/:id", controller.deleteProject);



// =============================
// Image Management
// =============================

// Delete project image
router.delete("/:id/image/:imageId", controller.deleteProjectImage);


// Update single image
router.put(
  "/:id/image/:imageId",
  upload.single("image"),
  controller.updateProjectImage
);



module.exports = router;
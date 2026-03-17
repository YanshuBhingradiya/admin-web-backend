const Lily = require("../models/home");
const HouseListing = require("../models/house");
const Booking = require("../models/booking");
const fs = require("fs");
const path = require("path");
const { log } = require("console");

// ==============================
// CREATE PROJECT
// ==============================
exports.createProject = async (req, res) => {
  try {
    console.log("Received body:", req.body);
    console.log("Received files:", req.files);

    const data = { ...req.body };

    // ================= LOCATION - HANDLE AS SEPARATE FIELDS =================
    if (data.location) {
      // Location is already a string from the form
      data.location = data.location;
    }
    
    // Handle latitude and longitude
    if (data.latitude) {
      data.latitude = parseFloat(data.latitude);
    }
    if (data.longitude) {
      data.longitude = parseFloat(data.longitude);
    }

    // ================= SET DEFAULT VALUES =================
    data.totalWings = data.totalWings ? Number(data.totalWings) : "";
    data.totalFloors = data.totalFloors ? Number(data.totalFloors) : "";
    data.perFloorHouse = data.perFloorHouse ? Number(data.perFloorHouse) : "";
    data.totalPlots = data.totalPlots ? Number(data.totalPlots) : "";
    data.bhkTypes = data.bhkTypes ? Number(data.bhkTypes) : "";
    data.price = data.price ? Number(data.price) : "";
    data.status = data.status || "active";

    // ================= HANDLE AMENITIES =================
    if (req.body.amenities) {
      if (Array.isArray(req.body.amenities)) {
        data.amenities = req.body.amenities;
      } else if (typeof req.body.amenities === 'string') {
        data.amenities = req.body.amenities.split(',').map(a => a.trim()).filter(a => a);
      }
    }

    // Handle BHK
// if (data.bhkTypes !== undefined) {
//   project.bhkTypes = Number(data.bhkTypes);
// }

    // ================= HANDLE IMAGES =================
    if (req.files?.images) {
      data.images = req.files.images.map((file) => ({
        url: `/uploads/projects/${file.filename}`,
        publicId: file.filename
      }));
    } else {
      data.images = [];
    }

    // ================= HANDLE FLOOR PLANS =================
    if (req.files?.floorPlans) {
      data.floorPlans = req.files.floorPlans.map((file, index) => ({
        title: `Floor Plan ${index + 1}`,
        url: `/uploads/projects/${file.filename}`,
        publicId: file.filename
      }));
    } else {
      data.floorPlans = [];
    }

    // ================= CREATE PROJECT =================
    console.log("Processed data for save:", JSON.stringify(data, null, 2));
    
    const project = new Lily(data);
    await project.save();
    
    console.log("Project saved successfully with ID:", project.id);
    console.log("Location:", project.location);
    console.log("Latitude:", project.latitude);
    console.log("Longitude:", project.longitude);
    log("Total Wings:", project.totalWings);
    log("Total Floors:", project.totalFloors);
    log("Per Floor House:", project.perFloorHouse);
    log("Total Plots:", project.totalPlots);
    log("BHK Types:", project.bhkTypes);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project
    });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(400).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ==============================
// GET ALL PROJECTS
// ==============================
exports.getProjects = async (req, res) => {
  try {
    const projects = await Lily.find().sort({ id: -1 });

    res.json({
      success: true,
      data: projects
    });
  } catch (err) {
    console.error("GET PROJECTS ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================
// GET PROJECT BY ID
// ==============================
exports.getProject = async (req, res) => {
  try {
    const project = await Lily.findOne({ id: Number(req.params.id) });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (err) {
    console.error("GET PROJECT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================
// UPDATE PROJECT
// ==============================
exports.updateProject = async (req, res) => {
  try {
    const data = { ...req.body };
    const projectId = Number(req.params.id);

    console.log("Update request for project:", projectId);
    console.log("Update data:", data);
    console.log("Uploaded files:", req.files);

    // ================= LOCATION - HANDLE AS SEPARATE FIELDS =================
    if (data.location !== undefined) {
      data.location = data.location;
    }
    
    // Handle latitude and longitude
    if (data.latitude !== undefined) {
      data.latitude = parseFloat(data.latitude);
    }
    if (data.longitude !== undefined) {
      data.longitude = parseFloat(data.longitude);
    }

    // Handle numeric fields with proper conversion
    if (data.totalWings !== undefined) data.totalWings = Number(data.totalWings);
    if (data.totalFloors !== undefined) data.totalFloors = Number(data.totalFloors);
    if (data.perFloorHouse !== undefined) data.perFloorHouse = Number(data.perFloorHouse);
    if (data.totalPlots !== undefined) {
      data.totalPlots = Number(data.totalPlots);
      console.log("Total plots value being set:", data.totalPlots);
    }
    if (data.price !== undefined) data.price = Number(data.price);

    if (data.bhkTypes !== undefined) data.bhkTypes = Number(data.bhkTypes);

    // Handle amenities
    if (data.amenities) {
      if (Array.isArray(data.amenities)) {
        data.amenities = data.amenities;
      } else if (typeof data.amenities === 'string') {
        data.amenities = data.amenities.split(',').map(a => a.trim()).filter(a => a);
      }
    }

    // Find the project first
    const project = await Lily.findOne({ id: projectId });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // ============ UPDATE BASIC FIELDS ============
    
    // Update project type if changed
    if (data.projectType && data.projectType !== project.projectType) {
      project.projectType = data.projectType;
    }
    
    // Update flat-specific fields
    if (data.totalWings !== undefined) {
      project.totalWings = data.totalWings;
    }
    if (data.totalFloors !== undefined) {
      project.totalFloors = data.totalFloors;
    }
    if (data.perFloorHouse !== undefined) {
      project.perFloorHouse = data.perFloorHouse;
    }
    
    // Update total plots for banglow/row-house
    if (data.totalPlots !== undefined) {
      const newTotalPlots = Math.max(0, Number(data.totalPlots));
      project.totalPlots = newTotalPlots;
      console.log("Updated total plots to:", project.totalPlots);
    }

    // Update other fields
    if (data.projectName !== undefined) project.projectName = data.projectName;
    if (data.location !== undefined) project.location = data.location;
    if (data.latitude !== undefined) project.latitude = data.latitude;
    if (data.longitude !== undefined) project.longitude = data.longitude;
    if (data.price !== undefined) project.price = data.price;
    if (data.status !== undefined) project.status = data.status;
    if (data.description !== undefined) project.description = data.description;
    if (data.bhkTypes !== undefined) project.bhkTypes = data.bhkTypes;
    
    // Update amenities
    if (data.amenities !== undefined) {
      project.amenities = data.amenities;
    }

    // ============ HANDLE IMAGES ============
    const shouldReplaceImages = data.replaceImages === 'true' || data.replaceImages === true;
    
    if (req.files?.images) {
      const newImages = req.files.images.map((file) => ({
        url: `/uploads/projects/${file.filename}`,
        publicId: file.filename
      }));
      
      console.log(`Processing ${newImages.length} new images`);
      console.log("Replace images flag:", shouldReplaceImages);
      
      if (shouldReplaceImages) {
        // Delete old images from filesystem
        if (project.images && project.images.length > 0) {
          console.log(`Deleting ${project.images.length} old images`);
          project.images.forEach(image => {
            const filePath = path.join(__dirname, "..", image.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted image: ${filePath}`);
            }
          });
        }
        project.images = newImages;
      } else {
        project.images = [...(project.images || []), ...newImages];
      }
    }

    // ============ HANDLE FLOOR PLANS ============
    const shouldReplaceFloorPlans = data.replaceFloorPlans === 'true' || data.replaceFloorPlans === true;
    
    if (req.files?.floorPlans) {
      const newFloorPlans = req.files.floorPlans.map((file, index) => {
        const nextIndex = (project.floorPlans?.length || 0) + index + 1;
        return {
          title: data.floorPlanTitles?.[index] || `Floor Plan ${nextIndex}`,
          url: `/uploads/projects/${file.filename}`,
          publicId: file.filename
        };
      });
      
      console.log(`Processing ${newFloorPlans.length} new floor plans`);
      console.log("Replace floor plans flag:", shouldReplaceFloorPlans);
      console.log("bhks value:", data.bhkTypes);
      
      if (shouldReplaceFloorPlans) {
        // Delete old floor plans from filesystem
        if (project.floorPlans && project.floorPlans.length > 0) {
          console.log(`Deleting ${project.floorPlans.length} old floor plans`);
          project.floorPlans.forEach(plan => {
            const filePath = path.join(__dirname, "..", plan.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted floor plan: ${filePath}`);
            }
          });
        }
        project.floorPlans = newFloorPlans;
      } else {
        project.floorPlans = [...(project.floorPlans || []), ...newFloorPlans];
      }
    }

    // ============ HANDLE IMAGE DELETIONS ============
    if (data.deleteImages) {
      try {
        const imagesToDelete = Array.isArray(data.deleteImages) 
          ? data.deleteImages 
          : [data.deleteImages];
        
        project.images = project.images.filter(image => {
          const shouldDelete = imagesToDelete.includes(image.publicId) || 
                              imagesToDelete.includes(image._id?.toString());
          
          if (shouldDelete) {
            const filePath = path.join(__dirname, "..", image.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          
          return !shouldDelete;
        });
      } catch (deleteError) {
        console.error("Error deleting specific images:", deleteError);
      }
    }

    // ============ HANDLE FLOOR PLAN DELETIONS ============
    if (data.deleteFloorPlans) {
      try {
        const floorPlansToDelete = Array.isArray(data.deleteFloorPlans) 
          ? data.deleteFloorPlans 
          : [data.deleteFloorPlans];
        
        project.floorPlans = project.floorPlans.filter(plan => {
          const shouldDelete = floorPlansToDelete.includes(plan.publicId) || 
                              floorPlansToDelete.includes(plan._id?.toString());
          
          if (shouldDelete) {
            const filePath = path.join(__dirname, "..", plan.url);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
          
          return !shouldDelete;
        });
      } catch (deleteError) {
        console.error("Error deleting specific floor plans:", deleteError);
      }
    }

    // ============ RECALCULATE HOUSE NUMBERS ============
    if (project.projectType === "flat") {
      project.totalHouse = (project.totalWings || 0) * (project.totalFloors || 0) * (project.perFloorHouse || 0);
      
      const houses = [];
      for (let w = 0; w < project.totalWings; w++) {
        const wing = String.fromCharCode(65 + w);
        for (let f = 1; f <= project.totalFloors; f++) {
          for (let h = 1; h <= project.perFloorHouse; h++) {
            houses.push(`${wing}-${f}${String(h).padStart(2, "0")}`);
          }
        }
      }
      project.houseNumbers = houses;
    } else {
      project.totalHouse = project.totalPlots || 0;
      
      const houses = [];
      for (let i = 1; i <= project.totalPlots; i++) {
        houses.push(String(i).padStart(2, "0"));
      }
      project.houseNumbers = houses;
    }

    // Save the project
    await project.save();
    
    console.log("Project updated successfully with ID:", project.id);

    res.json({
      success: true,
      message: "Project updated successfully",
      data: project
    });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================
// DELETE PROJECT
// ==============================
exports.deleteProject = async (req, res) => {
  try {
    const projectId = Number(req.params.id);

    const project = await Lily.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Delete associated images from filesystem
    if (project.images && project.images.length > 0) {
      console.log(`Deleting ${project.images.length} images`);
      project.images.forEach(image => {
        const filePath = path.join(__dirname, "..", image.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted image: ${filePath}`);
        }
      });
    }

    // Delete associated floor plans from filesystem
    if (project.floorPlans && project.floorPlans.length > 0) {
      console.log(`Deleting ${project.floorPlans.length} floor plans`);
      project.floorPlans.forEach(plan => {
        const filePath = path.join(__dirname, "..", plan.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted floor plan: ${filePath}`);
        }
      });
    }

    await Lily.deleteOne({ id: projectId });
    
    // Also delete related house listings and bookings
    await HouseListing.deleteMany({ projectId });
    await Booking.deleteMany({ projectId });

    res.json({
      success: true,
      message: "Project deleted successfully"
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================
// GET PROJECT HOUSE LIST
// ==============================
exports.getProjectHouseList = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const project = await Lily.findOne({ id: projectId });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found"
      });
    }

    // Get bookings to determine availability
    const bookings = await Booking.find({ projectId });
    const bookedSet = new Set(bookings.map(b => String(b.houseNumber)));

    const houses = (project.houseNumbers || []).map(no => ({
      projectId,
      houseNumber: no,
      status: bookedSet.has(String(no)) ? "booked" : "available"
    }));

    res.json({
      success: true,
      data: houses
    });
  } catch (err) {
    console.error("HOUSE LIST ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==============================
// DELETE PROJECT IMAGE
// ==============================
exports.deleteProjectImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    const project = await Lily.findOne({ id: Number(id) });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const image = project.images.id(imageId);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        message: "Image not found" 
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, "..", image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted image: ${filePath}`);
    }

    // Remove image from array
    image.deleteOne();
    await project.save();

    res.json({
      success: true,
      message: "Image deleted successfully"
    });
  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ==============================
// UPDATE PROJECT IMAGE
// ==============================
exports.updateProjectImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    const project = await Lily.findOne({ id: Number(id) });
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found" 
      });
    }

    const image = project.images.id(imageId);
    if (!image) {
      return res.status(404).json({ 
        success: false, 
        message: "Image not found" 
      });
    }

    // Remove old file
    const oldPath = path.join(__dirname, "..", image.url);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
      console.log(`Deleted old image: ${oldPath}`);
    }

    // Update with new file
    image.url = `/uploads/projects/${req.file.filename}`;
    image.publicId = req.file.filename;
    
    await project.save();

    console.log(`Updated image ${imageId} with new file: ${req.file.filename}`);

    res.json({
      success: true,
      message: "Image updated successfully",
      data: { url: image.url }
    });
  } catch (err) {
    console.error("UPDATE IMAGE ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ==============================
// GET PROJECT COUNT
// ==============================
exports.getProjectsCount = async (req, res) => {
  try {
    const total = await Lily.countDocuments();

    res.json({
      success: true,
      totalProjects: total
    });
  } catch (err) {
    console.error("COUNT ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
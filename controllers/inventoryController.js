const Lily = require("../models/home");
const Booking = require("../models/booking");
const Inventory = require("../models/inventory");

/* ================= CREATE / UPDATE INVENTORY ================= */

exports.generateInventory = async (req, res) => {
  try {

    const projects = await Lily.find();

    const result = [];

    for (const project of projects) {

      const bookings = await Booking.find({ projectId: project.id });

      const soldHouse = bookings.length;

      const soldAmount = bookings.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0
      );

      const totalHouse = project.totalHouse || 0;

      const availableHouse = totalHouse - soldHouse;

      const totalSellingPrice = totalHouse * (project.price || 0);

      const remainingAmount = totalSellingPrice - soldAmount;

      let inventory = await Inventory.findOne({ projectId: project.id });

      if (!inventory) {
        inventory = new Inventory({
          projectId: project.id,
          projectName: project.projectName,
        });
      }

      inventory.totalHouse = totalHouse;
      inventory.soldHouse = soldHouse;
      inventory.availableHouse = availableHouse;
      inventory.totalSellingPrice = totalSellingPrice;
      inventory.soldAmount = soldAmount;
      inventory.remainingAmount = remainingAmount;

      await inventory.save();

      result.push(inventory);
    }

    res.json({
      success: true,
      message: "Inventory generated successfully",
      data: result
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


/* ================= GET INVENTORY ================= */

exports.getInventory = async (req, res) => {
  try {

    const inventory = await Inventory.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


/* ================= GET INVENTORY BY PROJECT ================= */

exports.getInventoryByProject = async (req, res) => {
  try {

    const projectId = Number(req.params.projectId);

    const inventory = await Inventory.findOne({ projectId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found"
      });
    }

    res.json({
      success: true,
      data: inventory
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
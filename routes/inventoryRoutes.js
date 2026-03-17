const express = require("express");
const router = express.Router();

const {
  generateInventory,
  getInventory,
  getInventoryByProject
} = require("../controllers/inventoryController");


/* Generate Inventory */
router.get("/generate", generateInventory);

/* Get All Inventory */
router.get("/", getInventory);

/* Get Inventory by Project */
router.get("/:projectId", getInventoryByProject);

module.exports = router;

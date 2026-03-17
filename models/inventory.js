const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
{
  projectId: {
    type: Number,
    required: true,
    unique: true
  },

  projectName: String,

  totalHouse: {
    type: Number,
    default: 0
  },

  soldHouse: {
    type: Number,
    default: 0
  },

  availableHouse: {
    type: Number,
    default: 0
  },

  totalSellingPrice: {
    type: Number,
    default: 0
  },

  soldAmount: {
    type: Number,
    default: 0
  },

  remainingAmount: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Inventory", InventorySchema);
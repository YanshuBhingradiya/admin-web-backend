const mongoose = require("mongoose");
const Counter = require("./counter");

const LilySchema = new mongoose.Schema(
  {
    // Auto-incremented ID
    id: { type: Number, unique: true },
    
    // Basic Info
    projectName: { type: String, required: true },
    projectType: { type: String, required: true, enum: ["flat", "banglow", "row-house"] },
    price: { type: Number },
    status: { type: String, default: "active" },
    description: String,

    // Location - STORED AS SEPARATE FIELDS
    location: { type: String }, // Address text
    latitude: { type: Number }, // Latitude coordinate
    longitude: { type: Number }, // Longitude coordinate
    
    // Project configuration
    totalWings: { type: Number, default: 0 },
    totalFloors: { type: Number, default: 0 },
    perFloorHouse: { type: Number, default: 0 },
    totalPlots: { type: Number, default: 0 },
    
    // Auto-generated fields
    totalHouse: { type: Number, default: 0 },
    houseNumbers: [{ type: String }],

    // Amenities
    amenities: [String],

    // Media
    images: [
      {
        url: String,
        publicId: String
      }
    ],

    floorPlans: [
      {
        title: String,
        url: String,
        publicId: String
      }
    ]
  },
  { timestamps: true }
);

/* ================= PRE SAVE ================= */
LilySchema.pre("save", async function (next) {
  try {
    // Auto increment ID
    if (!this.id) {
      const counter = await Counter.findOneAndUpdate(
        { model: "lily" },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.count;
    }

    // Flat logic - generate house numbers
    if (this.projectType === "flat") {
      // Calculate total houses
      this.totalHouse = (this.totalWings || 0) * (this.totalFloors || 0) * (this.perFloorHouse || 0);
      
      const houses = [];
      for (let w = 0; w < this.totalWings; w++) {
        const wing = String.fromCharCode(65 + w); // A, B, C, D...
        for (let f = 1; f <= this.totalFloors; f++) {
          for (let h = 1; h <= this.perFloorHouse; h++) {
            houses.push(`${wing}-${f}${String(h).padStart(2, "0")}`);
          }
        }
      }
      this.houseNumbers = houses;
    }
    // Banglow / Row-house logic
    else {
      this.totalHouse = this.totalPlots || 0;
      this.houseNumbers = Array.from(
        { length: this.totalPlots || 0 },
        (_, i) => String(i + 1).padStart(2, "0")
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Lily", LilySchema);
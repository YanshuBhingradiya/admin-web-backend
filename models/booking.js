const mongoose = require("mongoose");
const Counter = require("./counter");

const EmiSchema = new mongoose.Schema({
  monthNo: Number,
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending",
  },
  paidDate: Date,
});

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: Number, unique: true },

    projectId: { type: Number, required: true },
    houseNumber: { type: String, required: true },

    customerName: { 
      type: String, 
      required: true,
      minlength: [3, "Customer name must be at least 3 characters"]
    },

    mobileNo: { 
      type: String, 
      required: true,
      match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"]
    },

    totalSqFeet: { 
      type: Number, 
      required: true,
      min: [1, "Total Sq.Ft must be greater than 0"]
    },

    pricePerSqFeet: { 
      type: Number, 
      required: true,
      min: [1, "Price must be greater than 0"]
    },

    advancePayment: { 
      type: Number,
      min: [0, "Advance cannot be negative"]
    },

    totalAmount: { type: Number },
    pendingAmount: { type: Number },

    paymentType: {
      type: String,
      enum: ["cash", "bank", "emi"],
      required: true,
    },

    emiMonths: { 
      type: Number,
      min: [1, "EMI months must be at least 1"]
    },

    monthlyEmi: { 
      type: Number,
      min: [1, "Monthly EMI must be greater than 0"]
    },

    emiSchedule: [EmiSchema],

    bookingDate: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

/* Auto Increment */
BookingSchema.pre("save", async function (next) {
  if (!this.bookingId) {
    const counter = await Counter.findOneAndUpdate(
      { model: "booking" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    this.bookingId = counter.count;
  }

  this.totalAmount = this.totalSqFeet * this.pricePerSqFeet;
  this.pendingAmount = this.totalAmount - this.advancePayment;

  next();
});

/* Unique per house */
BookingSchema.index({ projectId: 1, houseNumber: 1 }, { unique: true });

module.exports = mongoose.model("Booking", BookingSchema);
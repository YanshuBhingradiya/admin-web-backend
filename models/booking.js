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

    customerName: { type: String, required: true },
    mobileNo: { type: String, required: true },

    totalSqFeet: { type: Number, required: true },
    pricePerSqFeet: { type: Number, required: true },

  
    advancePayment: { type: Number},
  

    totalAmount: { type: Number },
    pendingAmount: { type: Number },

    paymentType: {
      type: String,
      enum: ["cash", "bank", "emi"],
      required: true,
    },

    emiMonths: { type: Number},
    monthlyEmi: { type: Number},
    emiSchedule: [EmiSchema],

    bookingDate: { type: Date, default: Date.now },
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
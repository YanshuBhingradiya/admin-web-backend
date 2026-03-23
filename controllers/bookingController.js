const Booking = require("../models/booking");
const HouseListing = require("../models/house");
const Inventory = require("../models/inventory");
const Lily = require("../models/home");


/* ================= CREATE BOOKING ================= */
exports.createBooking = async (req, res) => {
  try {
    const {
      projectId,
      houseNumber,
      customerName,
      mobileNo,
      paymentType,
      totalSqFeet,
      pricePerSqFeet,
      advancePayment,
      emiMonths,
      monthlyEmi,
      bookingDate,
    } = req.body;

    if (!projectId || !houseNumber) {
      return res.status(400).json({
        success: false,
        message: "Project and house number required",
      });
    }

    if (!/^[0-9]{10}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    if (customerName.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Customer name must be at least 3 characters",
      });
    }

    if (Number(totalSqFeet) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total Sq.Ft must be greater than 0",
      });
    }

    if (Number(pricePerSqFeet) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price per Sq.Ft must be greater than 0",
      });
    }

    const totalAmount = Number(totalSqFeet) * Number(pricePerSqFeet);
    const advance = Number(advancePayment || 0);

    /* ✅ REQUIRED BOOKING AMOUNT */
    if (!advance || advance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Booking amount is required and must be greater than 0",
      });
    }

    if (advance > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Advance cannot exceed total amount",
      });
    }

    const pendingAmount = totalAmount - advance;

    /* Check house availability */
    let house = await HouseListing.findOne({ projectId, houseNumber });

    if (house && house.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "House already booked",
      });
    }

    if (!house) {
      house = new HouseListing({ projectId, houseNumber });
    }

    house.status = "booked";
    await house.save();

    /* EMI */
    let emiSchedule = [];

    if (paymentType === "emi") {
      if (!emiMonths || !monthlyEmi) {
        return res.status(400).json({
          success: false,
          message: "EMI details required",
        });
      }

      let remaining = pendingAmount;

      for (let i = 1; i <= emiMonths; i++) {
        const amount =
          i === emiMonths ? remaining : Number(monthlyEmi);

        emiSchedule.push({
          monthNo: i,
          amount,
          status: "pending",
        });

        remaining -= monthlyEmi;
      }
    }

    const booking = await Booking.create({
      projectId,
      houseNumber,
      customerName,
      mobileNo,
      totalSqFeet,
      pricePerSqFeet,
      advancePayment: advance,
      paymentType,
      bookingDate,
    });

    /* ================= UPDATE INVENTORY ================= */

const project = await Lily.findOne({ id: projectId });

let inventory = await Inventory.findOne({ projectId });

if (!inventory) {
  inventory = new Inventory({
    projectId: projectId,
    projectName: project.projectName,
    totalHouse: project.totalHouse,
    soldHouse: 0,
    availableHouse: project.totalHouse,
    totalSellingPrice: project.totalHouse * (project.price || 0),
    soldAmount: 0,
    remainingAmount: project.totalHouse * (project.price || 0)
  });
}

/* update values */

inventory.soldHouse += 1;

inventory.availableHouse = inventory.totalHouse - inventory.soldHouse;

inventory.soldAmount += totalAmount;

inventory.remainingAmount =
  inventory.totalSellingPrice - inventory.soldAmount;

await inventory.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  }catch (err) {
  console.error("BOOKING ERROR FULL:", err);   // 👈 IMPORTANT
  res.status(500).json({
    success: false,
    message: err.message,
  });
}
};

/* ================= GET ALL BOOKINGS ================= */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET SINGLE BOOKING ================= */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingId: req.params.bookingId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= PAY EMI ================= */
exports.payEmi = async (req, res) => {
  try {
    const { bookingId, monthNo } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const emi = booking.emiSchedule.find(e => e.monthNo === monthNo);

    if (!emi || emi.status === "paid") {
      return res.status(400).json({ success: false, message: "Invalid EMI" });
    }

    emi.status = "paid";
    emi.paidDate = new Date();
    booking.pendingAmount -= emi.amount;

    /* If fully paid */
    if (booking.pendingAmount <= 0) {
      booking.pendingAmount = 0;
      await HouseListing.findOneAndUpdate(
        { projectId: booking.projectId, houseNumber: booking.houseNumber },
        { status: "sold" }
      );
    }

    await booking.save();

    res.json({
      success: true,
      message: "EMI paid successfully",
      pendingAmount: booking.pendingAmount,
      data: booking,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payCashRemaining = async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking || booking.paymentType !== "cash") {
      return res.status(400).json({ success: false, message: "Invalid cash booking" });
    }

    booking.pendingAmount -= amount;

    if (booking.pendingAmount <= 0) {
      booking.pendingAmount = 0;
      await HouseListing.findOneAndUpdate(
        { projectId: booking.projectId, houseNumber: booking.houseNumber },
        { status: "sold" }
      );
    }

    await booking.save();

    res.json({
      success: true,
      message: "Cash payment received",
      pendingAmount: booking.pendingAmount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
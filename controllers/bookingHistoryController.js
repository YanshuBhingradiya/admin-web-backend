const Booking = require("../models/booking");
const BookingHistory = require("../models/bookingHistory");
const Lily = require("../models/home"); // your Lily schema file (home.js)

exports.addPayment = async (req, res) => {
  try {
    const {
      bookingId,
      amountReceived,
      paymentMethod,
      paymentDetails,
      paymentReceivedDate,
    } = req.body;

    if (!bookingId || !amountReceived || !paymentMethod || !paymentReceivedDate) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔑 Fetch project using numeric id
    const project = await Lily.findOne({ id: booking.projectId });
    if (!project) {
      return res.status(400).json({ message: "Project not found" });
    }

    const projectName = project.projectName;

    const historyCount = await BookingHistory.countDocuments({
      bookingId: booking._id,
    });

    if (historyCount === 0 && booking.advancePayment > 0) {
  const advancePending =
    booking.totalAmount - booking.advancePayment;

  const advanceHistory = new BookingHistory({
    bookingId: booking._id,
    projectName,
    customerName: booking.customerName,
    houseNumber: booking.houseNumber,
    totalAmount: booking.totalAmount,
    advancePayment: booking.advancePayment,
    pendingAmount: advancePending < 0 ? 0 : advancePending,
    amountReceived: booking.advancePayment,
    paymentMethod: "advance",
    paymentDetails: "Advance payment at booking time",
    paymentReceivedDate: booking.createdAt,
  });

  await advanceHistory.save();
}


    if (amountReceived > booking.pendingAmount) {
      return res.status(400).json({
        message: "Amount exceeds pending payment",
      });
    }

    const newPending = booking.pendingAmount - amountReceived;

booking.pendingAmount = newPending < 0 ? 0 : newPending;

const history = new BookingHistory({
  bookingId: booking._id,
  projectName,
  customerName: booking.customerName,
  houseNumber: booking.houseNumber,
  totalAmount: booking.totalAmount,
  advancePayment: booking.advancePayment,
  pendingAmount: booking.pendingAmount,
  amountReceived,
  paymentMethod,
  paymentDetails,
  paymentReceivedDate,
});

await booking.save();
await history.save();


    res.status(201).json({
      message: "Payment recorded successfully",
      data: history,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



/* ================= GET DATE-WISE HISTORY ================= */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { bookingId, fromDate, toDate, paymentMethod } = req.query;

    const filter = {};

    if (bookingId) {
      filter.bookingId = bookingId;
    }

    if (fromDate && toDate) {
      filter.paymentReceivedDate = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate),
      };
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    // const history = await BookingHistory.find(filter)
    //   .sort({ paymentReceivedDate: 1 });

     const history = await BookingHistory.find(filter)
      .sort({ createdAt: -1 });


    res.json({ data: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({ data: booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



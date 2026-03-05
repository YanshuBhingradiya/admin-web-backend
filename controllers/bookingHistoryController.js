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

    // Find existing history
    let history = await BookingHistory.findOne({ bookingId });

    //  If first time create document
    if (!history) {
      history = new BookingHistory({
        bookingId: booking._id,
        customerName: booking.customerName,
        houseNumber: booking.houseNumber,
        totalAmount: booking.totalAmount,
        advancePayment: booking.advancePayment,
        pendingAmount: booking.totalAmount - booking.advancePayment,
        payments: [],
      });

      // Add advance payment automatically
      if (booking.advancePayment > 0) {
        history.payments.push({
          amountReceived: booking.advancePayment,
          paymentMethod: "advance",
          paymentDetails: { note: "Advance payment at booking time" },
          paymentReceivedDate: booking.createdAt,
        });
      }
    }

    //  Check pending
    if (amountReceived > history.pendingAmount) {
      return res.status(400).json({
        message: "Amount exceeds pending payment",
      });
    }

    //  Push new payment into array
    history.payments.push({
      amountReceived,
      paymentMethod,
      paymentDetails,
      paymentReceivedDate,
    });

    //  Minus from pending
    history.pendingAmount =
      history.pendingAmount - amountReceived < 0
        ? 0
        : history.pendingAmount - amountReceived;

    //  Also update booking pending
    booking.pendingAmount = history.pendingAmount;

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
    const { bookingId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ message: "BookingId required" });
    }

    const history = await BookingHistory.findOne({ bookingId });

    if (!history) {
      return res.json({ data: null });
    }

    // ✅ Custom sort
    // history.payments.sort((a, b) => {
    //   // Advance always first
    //   if (a.paymentMethod === "advance") return -1;
    //   if (b.paymentMethod === "advance") return 1;

    //   // Then sort by date ASC
    //   return (
    //     new Date(a.paymentReceivedDate) -
    //     new Date(b.paymentReceivedDate)
    //   );
    // });

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




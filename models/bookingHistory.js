const mongoose = require("mongoose");

const BookingHistorySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // projectName: { type: String, required: true }, // store text

    customerName: { type: String, required: true },
    houseNumber: { type: String, required: true },

    totalAmount: { type: Number, required: true },
    advancePayment: { type: Number, required: true },
    pendingAmount: { type: Number, required: true },

    amountReceived: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank", "cheque", "card", "advance"],
      required: true,
    },

    paymentDetails: {
      upiTxnId: String,
      bankName: String,
      transactionId: String,
      chequeNo: String,
      chequeDate: Date,
      cardType: { type: String, enum: ["debit", "credit"] },
      last4Digits: String,
    },

    paymentReceivedDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

BookingHistorySchema.index({ paymentReceivedDate: 1 });

module.exports = mongoose.model("BookingHistory", BookingHistorySchema);

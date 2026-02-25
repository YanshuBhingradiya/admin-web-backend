const express = require("express");
const router = express.Router();

const {
  addPayment,
  getPaymentHistory,
  getBookingById,
} = require("../controllers/bookingHistoryController");

/* Add payment */
router.post("/add-payment", addPayment);

/* Get all / filter history */
router.get("/", getPaymentHistory);

/* Get single booking */
router.get("/:id", getBookingById);

module.exports = router;
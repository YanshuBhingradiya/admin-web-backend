const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
require("dotenv").config();

const lilyRoutes = require("./routes/homeRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const bookingHistoryRoutes = require("./routes/bookingHistoryRoutes");
const testimonialRoutes = require("./routes/testimonialRoutes");
const faqRoutes = require("./routes/faqRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= STATIC FILES - FIXED ================= */
// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Also serve specifically from /uploads/projects
app.use("/uploads/projects", express.static(path.join(__dirname, "uploads/projects")));

// Add a test route to check if files exist
app.get("/test-image/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads/projects", req.params.filename);
  const fs = require('fs');
  
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false, path: filePath });
  }
});

/* ================= ROUTES ================= */
connectDB().then(() => {
  console.log("MongoDB connected");

  app.use("/api/lily", lilyRoutes);
  app.use("/api/services", serviceRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/payment-history", bookingHistoryRoutes);
  app.use("/api/testimonials", testimonialRoutes);
  app.use("/api/faqs", faqRoutes);

  // Contact Routes
  const contactRoute = require("./routes/contact");
  app.use("/api/contact", contactRoute);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  );
});

const express = require("express");
const router = express.Router();
const { loginAdmin, logoutAdmin } = require("../controllers/adminController");
const { verifyAdmin } = require("../middleware/authMiddleware");

router.post("/login", loginAdmin);
router.post("/logout", verifyAdmin, logoutAdmin);

module.exports = router;
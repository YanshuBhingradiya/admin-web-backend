const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Admin = require("./models/Admin");

mongoose.connect(process.env.MONGO_URI);

async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    username: "admin",
    password: hashedPassword,
  });

  console.log("Admin Created");
  process.exit();
}

createAdmin();
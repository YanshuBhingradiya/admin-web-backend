const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  date: {
    type: String
  },
  readTime: {
    type: String
  },
  author: {
    name: String,
    role: String
  }
});

module.exports = mongoose.model("Blog", blogSchema);
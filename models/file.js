const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
  _id: String,
  catbox_url: String,
  telegram_url: String,
  type: String,
  size: Number,
});

module.exports = mongoose.model("File", FileSchema);

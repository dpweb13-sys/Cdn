const express = require("express");
const mongoose = require("mongoose");
const bot = require("./bot");
const config = require("./config");

const app = express();
app.get("/", (req, res) => res.send("✅ File Rabbit Bot is Running!"));
app.get("/ping", (req, res) => res.send("pong")); // For UptimeRobot

mongoose.connect(config.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

bot.launch().then(() => console.log("🤖 Telegram Bot Started"));

app.listen(3000, () => console.log("🚀 Server running on port 3000"));

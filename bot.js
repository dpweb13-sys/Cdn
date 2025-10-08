const axios = require("axios");
const { Telegraf } = require("telegraf");
const { v4: uuidv4 } = require("uuid");
const File = require("./models/File");
const config = require("./config");

const bot = new Telegraf(config.BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("📁 Welcome! Send me a photo/video/file to upload it securely.");
});

bot.on(["photo", "video", "document"], async (ctx) => {
  try {
    await ctx.reply("⏳ Uploading your file...");

    // File link fetch
    const fileId =
      ctx.message.document?.file_id ||
      ctx.message.photo?.pop()?.file_id ||
      ctx.message.video?.file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;

    // Upload to Catbox
    const catboxResp = await axios.post(
      "https://catbox.moe/user/api.php",
      new URLSearchParams({
        reqtype: "urlupload",
        url: fileUrl,
      })
    );

    const uniqueId = uuidv4().slice(0, 4);

    // Save to MongoDB
    await File.create({
      _id: uniqueId,
      catbox_url: catboxResp.data,
      telegram_url: fileUrl,
      type: ctx.message.document?.mime_type || ctx.message.video?.mime_type || "image/jpeg",
      size: ctx.message.document?.file_size || ctx.message.video?.file_size || 0,
    });

    const publicLink = `${config.VERCE_URL}/cdn/${uniqueId}.jpg`;

    await ctx.reply(`✅ Uploaded successfully!\n\n📎 Your public link:\n${publicLink}`);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Upload failed. Try again later.");
  }
});

module.exports = bot;

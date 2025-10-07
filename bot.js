import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) =>
  ctx.reply("📁 Send me any file — I’ll upload it and give you a clean CDN link.")
);

bot.on("document", async (ctx) => {
  try {
    const file = ctx.message.document;
    const link = await ctx.telegram.getFileLink(file.file_id);
    const response = await axios.get(link.href, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data).toString("base64");

    const upload = await axios.post("https://YOUR_RENDER_URL/api/upload", {
      buffer,
      filename: file.file_name,
      mimetype: file.mime_type,
    });

    await ctx.reply(`✅ Uploaded!\n\n🔗 ${upload.data.link}`);
  } catch (err) {
    console.log(err);
    await ctx.reply("❌ Upload failed");
  }
});

bot.launch();
console.log("🤖 Telegram Bot Started");

import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import FormData from "form-data";
import { connectDB, File } from "./lib/db.js";
import { randomBytes } from "crypto";

dotenv.config();
const app = express();
app.use(express.json({ limit: "100mb" }));

await connectDB();

app.post("/api/upload", async (req, res) => {
  try {
    const { buffer, filename, mimetype } = req.body;
    const id = randomBytes(2).toString("hex");
    const uploadTime = new Date().toISOString();

    // Upload to Catbox
    let catboxUrl = null;
    try {
      const catForm = new FormData();
      catForm.append("reqtype", "fileupload");
      catForm.append("fileToUpload", Buffer.from(buffer, "base64"), filename);
      const cat = await axios.post("https://catbox.moe/user/api.php", catForm, {
        headers: catForm.getHeaders(),
      });
      catboxUrl = cat.data;
    } catch (err) {
      console.log("❌ Catbox upload failed:", err.message);
    }

    // Upload to Telegram
    let tgFileUrl = null;
    try {
      const tgForm = new FormData();
      tgForm.append("chat_id", process.env.CHANNEL_ID);
      tgForm.append("document", Buffer.from(buffer, "base64"), filename);
      const tg = await axios.post(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendDocument`,
        tgForm,
        { headers: tgForm.getHeaders() }
      );
      const filePath = await axios.get(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/getFile?file_id=${tg.data.result.document.file_id}`
      );
      tgFileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath.data.result.file_path}`;
    } catch (err) {
      console.log("❌ Telegram upload failed:", err.message);
    }

    // Save to MongoDB
    const main = tgFileUrl || catboxUrl;
    const backup = tgFileUrl ? catboxUrl : null;
    const ext = filename.split(".").pop();
    const final = `${process.env.CDN_DOMAIN}/cdn/${id}.${ext}`;

    const fileDoc = new File({
      id,
      name: filename,
      type: mimetype,
      size: `${(Buffer.from(buffer, "base64").length / 1024 / 1024).toFixed(2)} MB`,
      main,
      backup,
      final,
      uploadTime,
    });
    await fileDoc.save();

    res.json({ success: true, link: final, info: fileDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/info", async (req, res) => {
  const { id } = req.query;
  const file = await File.findOne({ id });
  if (!file) return res.status(404).json({ error: "File not found" });
  res.json(file);
});

app.listen(3000, () => console.log("🚀 Backend running on Render"));

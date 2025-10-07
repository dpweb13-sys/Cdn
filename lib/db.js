import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  type: String,
  size: String,
  main: String,
  backup: String,
  final: String,
  uploadTime: String,
});

export const File = mongoose.models.File || mongoose.model("File", fileSchema);

export const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  }
};

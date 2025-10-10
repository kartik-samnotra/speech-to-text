require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Initialize OpenAI before use
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Multer setup
const upload = multer({ dest: "uploads/" });

// ✅ MongoDB connection (optional)
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Schema for saving transcriptions
const transcriptionSchema = new mongoose.Schema({
  filename: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Transcription = mongoose.model("Transcription", transcriptionSchema);

// ✅ Whisper transcription function
async function transcribeAudio(filePath) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });
    return response.text;
  } catch (error) {
    console.error("❌ OpenAI transcription error:", error);
    throw new Error("Transcription failed");
  }
}

// ✅ Upload endpoint
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const text = await transcribeAudio(filePath);

    // Save to Mongo (optional)
    const doc = await Transcription.create({
      filename: req.file.originalname,
      text,
    });

    fs.unlinkSync(filePath); // Cleanup temporary file

    res.json({ success: true, transcription: doc });
  } catch (err) {
    console.error("❌ Server error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { createClient } = require("@deepgram/sdk");

const app = express();
app.use(cors());
app.use(express.json());

// Multer upload config
const upload = multer({ dest: "uploads/" });

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Initialize Deepgram client (v3 syntax)
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Mongo schema
const transcriptionSchema = new mongoose.Schema({
  filename: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Transcription = mongoose.model("Transcription", transcriptionSchema);

// Upload & Transcribe Endpoint
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const fileBuffer = fs.readFileSync(filePath);

    console.log("🎙️ Transcribing audio with Deepgram...");

    const { result } = await deepgram.listen.prerecorded.transcribeFile(
      fileBuffer,
      {
        model: "nova-2",
        smart_format: true,
        mimetype: "audio/wav",
      }
    );

    const transcriptText = result.results.channels[0].alternatives[0].transcript || "No speech detected";

    // Save to MongoDB
    const doc = await Transcription.create({
      filename: req.file.originalname,
      text: transcriptText,
    });

    fs.unlinkSync(filePath); // delete after processing
    res.json({ success: true, text: transcriptText });
  } catch (err) {
    console.error("❌ Transcription error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
const PORT = process.env.POR

import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@deepgram/sdk";
import mongoose from "mongoose";
import fs from "fs";

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB (optional)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Deepgram client
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Route: Transcribe Audio
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = req.file.path;

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(audioPath),
      { model: "nova-2" }  // Fast and accurate model
    );

    fs.unlinkSync(audioPath); // clean up temp file

    if (error) {
      console.error("❌ Deepgram error:", error);
      return res.status(500).json({ error: "Deepgram failed" });
    }

    const transcript = result.results.channels[0].alternatives[0].transcript;
    res.json({ text: transcript });
  } catch (error) {
    console.error("❌ Server error:", error);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

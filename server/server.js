require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require("openai");   // ✅ Correct import for CommonJS


const app = express();
app.use(cors());
app.use(express.json());

// Multer config to store uploaded files
const upload = multer({ dest: 'uploads/' });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Transcription model
const transcriptionSchema = new mongoose.Schema({
  filename: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});
const Transcription = mongoose.model('Transcription', transcriptionSchema);

// Upload endpoint
app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = path.resolve(req.file.path);

    // TODO: call your Speech-to-Text API here
    const text = await transcribeAudio(filePath);

    const doc = await Transcription.create({
      filename: req.file.originalname,
      text,
    });

    fs.unlinkSync(filePath); // optional: delete file after processing

    res.json({ success: true, transcription: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});




const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


// Transcribe audio using OpenAI Whisper
async function transcribeAudio(filePath) {
  try {
    const resp = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
    });
    return resp.text;
  } catch (err) {
    console.error("OpenAI transcription error:", err);
    return "Error transcribing audio";
  }
}


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

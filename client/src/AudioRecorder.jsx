
import { useState, useRef } from "react";

export default function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Start recording
  const startRecording = async () => {
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioURL(URL.createObjectURL(blob));
    };

    mediaRecorderRef.current.start();
  };

  // Stop recording
  const stopRecording = () => {
    setRecording(false);
    mediaRecorderRef.current.stop();
  };

  // Upload audio to backend
  const uploadAudio = async () => {
    if (!audioURL) return;
    setUploading(true);

    const response = await fetch(audioURL);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");

    try {
      const res = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setTranscription(data.transcription.text);
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }

    setUploading(false);
  };

  return (
    <div className="w-full flex items-center justify-center min-h-screen">
      <div className="backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl rounded-3xl p-10 w-[90%] max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
          Speech to Text
        </h1>

        {/* Recording Controls */}
        <div className="flex flex-col gap-4 items-center">
          {!recording ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-blue-500/80 hover:bg-blue-600/80 text-white font-semibold rounded-full transition duration-300 backdrop-blur-sm"
            >
              🎙️ Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-500/80 hover:bg-red-600/80 text-white font-semibold rounded-full transition duration-300 backdrop-blur-sm"
            >
              ⏹️ Stop Recording
            </button>
          )}

          {/* File Upload */}
          <label className="cursor-pointer px-6 py-3 bg-gray-500/50 hover:bg-gray-600/60 text-white font-semibold rounded-full transition duration-300 backdrop-blur-sm">
            Upload Audio
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  const file = e.target.files[0];
                  setAudioURL(URL.createObjectURL(file));
                }
              }}
              className="hidden"
            />
          </label>

          {/* Audio Preview */}
          {audioURL && (
            <div className="mt-4 w-full">
              <audio
                controls
                src={audioURL}
                className="w-full rounded-lg backdrop-blur-sm"
              />
            </div>
          )}

          {/* Upload Button */}
          {audioURL && (
            <button
              onClick={uploadAudio}
              className="mt-4 px-6 py-3 bg-teal-500/80 hover:bg-teal-600/80 text-white font-semibold rounded-full transition duration-300 backdrop-blur-sm disabled:opacity-50"
              disabled={uploading}
            >
              {uploading ? "⏳ Uploading..." : "Transcribe Audio"}
            </button>
          )}

          {/* Transcription Result */}
          {transcription && (
            <div className="mt-6 p-4 bg-white/10 border border-white/20 rounded-xl text-left">
              <h2 className="font-bold mb-2 text-blue-300">📝 Transcription:</h2>
              <p className="text-gray-100 whitespace-pre-wrap">{transcription}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


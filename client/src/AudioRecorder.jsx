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
    <div className="flex flex-col items-center justify-center p-4 space-y-4">
      <div className="space-x-2">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Stop Recording
          </button>
        )}
      </div>

      {audioURL && (
  <div className="flex flex-col items-center space-y-2">
    {/* File upload input */}
    <input
      type="file"
      accept="audio/*"
      onChange={(e) => {
        if (e.target.files.length > 0) {
          const file = e.target.files[0];
          setAudioURL(URL.createObjectURL(file));
        }
      }}
      className="mb-2"
    />

    {/* Playback */}
    <audio src={audioURL} controls />

    {/* Upload button */}
    <button
      onClick={uploadAudio}
      className="px-4 py-2 bg-blue-500 text-white rounded"
      disabled={uploading}
    >
      {uploading ? "Uploading..." : "Upload Audio"}
    </button>
  </div>
)}




      {transcription && (
        <div className="mt-4 p-2 border rounded w-full max-w-md bg-gray-50">
          <h2 className="font-bold mb-2">Transcription:</h2>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

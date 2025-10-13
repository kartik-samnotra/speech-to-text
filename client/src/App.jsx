import { useState } from "react";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranscribe = async () => {
    const fileInput = document.getElementById("audioFile");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select or record an audio file first!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:4000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setTranscript(data.text || "No transcription returned.");
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-white/20">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          🎤 Speech to Text
        </h1>

        <input
          type="file"
          id="audioFile"
          accept="audio/*"
          className="w-full mb-4 text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
        />

        <button
          onClick={handleTranscribe}
          disabled={isLoading}
          className={`w-full py-2 rounded-md text-lg font-semibold transition ${
            isLoading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Transcribing..." : "Transcribe Audio"}
        </button>

        {transcript && (
          <div className="mt-6 bg-white/10 border border-white/10 p-4 rounded-md">
            <h2 className="font-semibold mb-2 text-blue-300">Transcription:</h2>
            <p className="text-gray-200 leading-relaxed">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
}

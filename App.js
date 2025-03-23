import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatEnabled, setChatEnabled] = useState(false);
  const chatEndRef = useRef(null);
  const [warning, setWarning] = useState("");

  // Debugging logs
  useEffect(() => {
    console.log("Chat Enabled:", chatEnabled);
    console.log("Chat History:", chatHistory);
  }, [chatEnabled, chatHistory]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    console.log("File selected:", selectedFile);
    if (selectedFile && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setWarning("Please upload a PDF file only.");
      setFile(null);
      setUploadStatus("");
    } else {
      setWarning("");
      setFile(selectedFile);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.log("No file selected");
      setUploadStatus("Please select a PDF file first");
      return;
    }

    console.log("Starting upload...");
    setUploadStatus("Uploading...");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("Upload successful:", response.data);
      setUploadStatus(response.data.message);
      setChatEnabled(true);
      setChatHistory([]); // Reset chat history on new upload
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      setUploadStatus(`Upload failed: ${errorMessage}`);
      setChatEnabled(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim() || !chatEnabled) {
      console.log("Empty question or chat disabled");
      return;
    }

    const userQuestion = question.trim();
    console.log("Sending question:", userQuestion);
    
    // Clear input immediately
    setQuestion("");
    
    // Add user message to history
    setChatHistory((prev) => [
      ...prev,
      { 
        sender: "user", 
        text: userQuestion,
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      const response = await axios.post(
        "http://localhost:8000/chat",
        { question: userQuestion }
      );
      console.log("Received response:", response.data);

      setChatHistory((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: response.data.response,
          timestamp: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error.response?.data?.detail || error.message;
      
      setChatHistory((prev) => [
        ...prev,
        { 
          sender: "bot", 
          text: `Error: ${errorMessage}`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  return (
    <div className="app-container">
      <h2 className="header">PDF Chatbot</h2>

      <div className="upload-section">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          id="file-upload"
          style={{ display: "none" }}
        />
        <label htmlFor="file-upload" className="custom-file-upload">
          Choose PDF
        </label>
        <button 
          onClick={handleUpload} 
          className="upload-button"
          disabled={!file}
        >
          {file ? `Upload ${file.name}` : "Select a file first"}
        </button>
        <div className="status-message">{uploadStatus}</div>
        {warning && <div className="warning-message">{warning}</div>}
      </div>

      <div className="chat-interface">
        {chatEnabled ? (
          <>
            <div className="chat-history">
              {chatHistory.map((msg, index) => (
                <div 
                  key={`${msg.timestamp}-${index}`} 
                  className={`message-container ${msg.sender}`}
                >
                  <div className="message-bubble">
                    <div className="message-sender">
                      {msg.sender === "user" ? "You" : "Bot"}
                    </div>
                    <div className="message-text">{msg.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about the PDF..."
                autoFocus
              />
              <button type="submit" className="send-button">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <p>📁 Upload a PDF to start chatting</p>
            <p>Supported files: PDF documents</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

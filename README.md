# PDF Chatbot

A PDF Chatbot allows users to upload a PDF document and then ask questions about its content. The system leverages LangChain and Hugging Face models to perform retrieval-augmented generation (RAG) for question answering. The agent retrieves relevant information from the uploaded document and synthesizes detailed answers using a language model.

## Features

- **PDF Upload:** Upload and process a PDF document.
- **Document Processing:** The PDF is split into manageable chunks, embedded using a SentenceTransformer, and stored in a FAISS vector store.
- **Question Answering:** The system retrieves relevant chunks using similarity search and uses a QA chain to generate detailed answers.
- **Agent-like Behavior:** The retrieval chain functions as an "agent" that combines the document context with a language model's reasoning to provide comprehensive answers.

## Getting Started

### Prerequisites

- **Python 3.7+**
- **Node.js & npm** (for the frontend)
- **Git** (optional, for cloning the repository)

### File Structure
    pdf-chatbot/
    ├── backend/
    │   ├── main.py          # Backend FastAPI application
    │   ├── .env             # Environment variables (e.g., HUGGINGFACEHUB_API_TOKEN)
    |   ├── uploads          # PDFs uploaded will be stored here.
    │   └── requirements.txt # Python dependencies
    └── frontend/
        ├── public/
        │   └── index.html   # HTML file for the React app
        ├── src/
        │   ├── App.js       # React UI code
        │   ├── App.css      # React UI styling
        │   └── index.js     # React entry point
        ├── package.json     # Node package configuration
        └── package-lock.json

### Backend Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/pdf-chatbot.git
   cd pdf-chatbot/backend


### Create and Activate a Virtual Environment:
    python -m venv venv

    
### On Windows (Command Prompt):
    venv\Scripts\activate

### On Windows (PowerShell):
    .\venv\Scripts\Activate.ps1
    
### On macOS/Linux:
    source venv/bin/activate
    
### Install Dependencies:
    pip install -r requirements.txt
    
### Configure Environment Variables:

## Create a .env file in the backend folder with the following (replace with your actual Hugging Face API token):
    HUGGINGFACEHUB_API_TOKEN=your_huggingface_api_token_here
    uvicorn main:app --reload
The backend will run at http://localhost:8000.

## Frontend Setup
### Navigate to the Frontend Folder:
    cd ../frontend
### Install Dependencies:
    npm install
### Run the Frontend:
    npm start
The frontend will be available at http://localhost:3000.

How It Works
PDF Processing & Vector Store
Upload & Processing:
When a user uploads a PDF, the backend saves the file temporarily, uses a PDF loader (PyPDFLoader) to extract the text, and then splits the document into chunks using a recursive character text splitter.

Embeddings & FAISS:
Each chunk is converted into a vector embedding using a SentenceTransformer model. These embeddings are stored in a FAISS vector store, enabling efficient similarity search for retrieval.

Retrieval-Augmented Generation (RAG) Agent
Retrieval:
When a question is asked, the system performs a similarity search in the FAISS vector store to retrieve the most relevant document chunks.

QA Chain:
The retrieved context is fed into a QA chain that uses a Hugging Face text-to-text generation model (via a Transformers pipeline) to generate a detailed, well-structured answer.

Agent Functionality:
This combination of retrieval and generation acts as an “agent” that leverages both the uploaded document’s context and the language model's reasoning abilities to provide a comprehensive answer.


Note: I have not used very advanced models in this project, considering limitations like token constraints, hardware availability, and performance efficiency. However, you can integrate more advanced models based on your requirements to achieve better accuracy and responses.

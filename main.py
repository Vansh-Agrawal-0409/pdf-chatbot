import os
import tempfile
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from transformers import pipeline
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.llms import HuggingFacePipeline
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pydantic import BaseModel
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder

# Load environment variables (if needed)
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Setup Hugging Face Pipeline LLM ---
# Using google/flan-t5-base for improved quality and performance.
llm_pipeline = pipeline(
    "text2text-generation", 
    model="google/flan-t5-base", 
    device=-1  # Use CPU; if you have a GPU and enough memory, set device=0.
)
llm = HuggingFacePipeline(pipeline=llm_pipeline)

# --- Setup Embeddings ---
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Global variable to hold our vector store (initially empty)
vector_store = None

# Pydantic model for chat requests (expects JSON with a "question" field)
class ChatRequest(BaseModel):
    question: str

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save the uploaded PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Load and split PDF using PyPDFLoader
        loader = PyPDFLoader(tmp_path)
        docs = loader.load_and_split()

        # Further split the documents into smaller chunks for better retrieval
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=200)
        docs = text_splitter.split_documents(docs)

        global vector_store
        # Create the vector store using our embeddings
        vector_store = FAISS.from_documents(docs, embeddings)

        # Remove the temporary file
        os.unlink(tmp_path)

        return {"message": "File processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: ChatRequest):
    if vector_store is None:
        raise HTTPException(status_code=400, detail="Please upload a PDF first")
    try:
        # Retrieve relevant documents via similarity search
        docs = vector_store.similarity_search(request.question, k=30)
        
        # Updated QA prompt with enriched instructions
        
        qa_system_prompt = (
            "You are a detailed, expert assistant. Based solely on the context provided below, "
            "provide a comprehensive, well-organized answer to the question. "
            "Break your answer into clear, numbered steps or bullet points and include examples when appropriate. "
            "For example:\n"
            "Q: What are the main points of the document?\n"
            "A:\n"
            "   1. The document explains ...\n"
            "   2. It highlights ...\n"
            "   3. It concludes that ...\n\n"
            "Context:\n{context}\n\n"
            "Question:"
        )
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", qa_system_prompt),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        # Build the QA chain using the enriched prompt with the 'stuff' chain
        chain = load_qa_chain(llm, chain_type="stuff", prompt=qa_prompt)
        
        # Supply extra keys required by the prompt template: "chat_history" and "input"
        result = chain.run(
            input_documents=docs,
            question=request.question,
            chat_history=[],
            input=request.question
        )
        return {"response": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

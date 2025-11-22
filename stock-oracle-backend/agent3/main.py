from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
from datetime import datetime
import pandas as pd
from agent3 import AnomalySentinel, generate_normal_data 

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Initialize the Brain
print("Initializing Agent 3...")
agent = AnomalySentinel()
# Train on startup (using synthetic data for the hackathon)
history = generate_normal_data(1000)
agent.train(history)

# 2. Define the Data Format (What Odoo sends us)
class TransactionRequest(BaseModel):
    qty: int
    hour: int           # 0-23
    damage_flag: int    # 0 or 1
    type: str           # 'move', 'transfer'
    has_receipt: bool

# 3. The Endpoint
@app.post("/analyze_transaction")
def analyze(trx: TransactionRequest):
    # Convert API data to the format our Agent expects
    transaction_data = {
        "timestamp": datetime.now().replace(hour=trx.hour), # Mocking the time for the demo
        "qty": trx.qty,
        "damage_flag": trx.damage_flag,
        "type": trx.type,
        "has_receipt": trx.has_receipt
    }
    
    # Run the Agent
    result = agent.analyze_transaction(transaction_data)
    
    return result

# Run with: uv run uvicorn main:app --reload --port 8000
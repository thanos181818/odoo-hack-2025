import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import random

# ==========================================
# PART 1: THE KNOWLEDGE BASE (RAG SIMULATION)
# ==========================================
# In a real app, this would be a Vector DB (Pinecone/Chroma) + LLM (GPT-4).
# Here, we simulate the "Context Retrieval" based on the error type.
RAG_KNOWLEDGE_BASE = {
    "TIME_VIOLATION": "POLICY 4.1: Operations between 02:00 and 05:00 require VP approval due to historical theft patterns.",
    "UNMATCHED_TRANSFER": "POLICY 2.3: Inter-warehouse transfers must be paired with a Goods Receipt Note (GRN) within 1 hour.",
    "STATISTICAL_ANOMALY": "RISK ALERT: This transaction deviates significantly (3+ std dev) from this user's historical baseline.",
    "DAMAGE_SPIKE": "QUALITY CONTROL: Sudden spike in 'Damaged' status exceeds the 1.5% threshold for this location."
}

# ==========================================
# PART 2: THE ANOMALY SENTINEL (AGENT 3)
# ==========================================
class AnomalySentinel:
    def __init__(self):
        self.scaler = StandardScaler()
        # Tech 1: Isolation Forest (Detects global outliers)
        self.iso_forest = IsolationForest(contamination=0.05, random_state=42)
        # Tech 2: One-Class SVM (Detects boundary violations/novelties)
        self.svm = OneClassSVM(nu=0.05)
        self.is_trained = False

    def _preprocess(self, df, training=False):
        """
        Converts raw transaction data into features the AI can understand.
        """
        data = df.copy()
        # Feature Engineering: Convert Timestamps to "Hour" (0-23)
        data['hour'] = data['timestamp'].apply(lambda x: x.hour)
        
        # Select numerical features for the AI
        features = data[['qty', 'hour', 'damage_flag']]
        
        if training:
            return self.scaler.fit_transform(features)
        else:
            return self.scaler.transform(features)

    def train(self, historical_data):
        """
        Learns 'Normal' behavior from historical data.
        """
        print(f"Training Agent 3 on {len(historical_data)} historical records...")
        X = self._preprocess(historical_data, training=True)
        
        # Train both models
        self.iso_forest.fit(X)
        self.svm.fit(X)
        self.is_trained = True
        print("Training Complete. Agent is online.")

    def analyze_transaction(self, transaction):
        """
        The Main Pipeline: Rules -> AI -> RAG
        """
        df = pd.DataFrame([transaction])
        current_hour = transaction['timestamp'].hour
        reasons = []
        status = "APPROVED"

        # --- LAYER 1: HARD RULES (Simple Thresholds) ---
        # Rule: Large adjustment at 3 AM
        if 2 <= current_hour <= 5 and transaction['qty'] > 100:
            status = "AUTO-PAUSED"
            reasons.append(f"Hard Rule Violation: High quantity move at {current_hour}:00.")
            context = RAG_KNOWLEDGE_BASE["TIME_VIOLATION"]

        # Rule: Transfer without receipt (Simulated by a flag here)
        if transaction['type'] == 'transfer' and not transaction['has_receipt']:
            status = "AUTO-PAUSED"
            reasons.append("Hard Rule Violation: Missing Receipt.")
            context = RAG_KNOWLEDGE_BASE["UNMATCHED_TRANSFER"]

        # If Hard Rules caught it, return early (efficiency)
        if status == "AUTO-PAUSED":
            return self._format_response(status, reasons, context)

        # --- LAYER 2: AI DETECTION (Isolation Forest + SVM) ---
        if self.is_trained:
            X = self._preprocess(df)
            
            # Isolation Forest Prediction (-1 is anomaly)
            iso_pred = self.iso_forest.predict(X)[0]
            # SVM Prediction (-1 is anomaly)
            svm_pred = self.svm.predict(X)[0]

            if iso_pred == -1 or svm_pred == -1:
                status = "FLAGGED_SUSPICIOUS"
                reasons.append("AI Model detected statistical anomaly (Unusual Pattern).")
                
                # Determine context based on data
                if transaction['damage_flag'] == 1:
                    context = RAG_KNOWLEDGE_BASE["DAMAGE_SPIKE"]
                else:
                    context = RAG_KNOWLEDGE_BASE["STATISTICAL_ANOMALY"]
                    
                return self._format_response(status, reasons, context)

        return self._format_response("APPROVED", ["Matches normal patterns"], "None")

    def _format_response(self, status, reasons, context):
        return {
            "status": status,
            "reasons": reasons,
            "rag_context": context
        }

# ==========================================
# PART 3: SYNTHETIC DATA GENERATOR (Since you have no data)
# ==========================================
def generate_normal_data(n=1000):
    data = []
    start_date = datetime.now() - timedelta(days=30)
    
    for _ in range(n):
        # Normal Ops: 8 AM to 6 PM
        rand_hour = random.randint(8, 18) 
        timestamp = start_date + timedelta(hours=random.randint(0, 700))
        timestamp = timestamp.replace(hour=rand_hour)
        
        data.append({
            'timestamp': timestamp,
            'qty': int(np.random.normal(50, 15)), # Avg 50 items
            'damage_flag': 0 if random.random() > 0.02 else 1, # 2% damage rate
            'type': 'move',
            'has_receipt': True
        })
    return pd.DataFrame(data)

# ==========================================
# PART 4: EXECUTION (RUNNING THE AGENT)
# ==========================================

# 1. Initialize
agent = AnomalySentinel()

# 2. Generate Data & Train
# We create "fake history" so the AI knows what "Normal" looks like
history_df = generate_normal_data(1000)
agent.train(history_df)

print("\n" + "="*50)
print("STARTING LIVE MONITORING")
print("="*50)

# 3. Test Cases

# CASE A: Normal Transaction
trx_normal = {
    'timestamp': datetime.now().replace(hour=14), # 2 PM
    'qty': 55,
    'damage_flag': 0,
    'type': 'move',
    'has_receipt': True
}

# CASE B: The "3 AM" Anomaly (Caught by Rules)
trx_hard_rule = {
    'timestamp': datetime.now().replace(hour=3), # 3 AM
    'qty': 500, # High Qty
    'damage_flag': 0,
    'type': 'move',
    'has_receipt': True
}

# CASE C: The "Hidden" Anomaly (Caught by AI)
# Time is normal (10 AM), but Qty is HUGE (1000) - Rules might miss this, but AI sees the outlier
trx_ai_anomaly = {
    'timestamp': datetime.now().replace(hour=10),
    'qty': 2000, # Massive outlier compared to the avg of 50
    'damage_flag': 0,
    'type': 'move',
    'has_receipt': True
}

# CASE D: Damage Spike (Caught by SVM)
trx_damage = {
    'timestamp': datetime.now().replace(hour=11),
    'qty': 40,
    'damage_flag': 1, # DAMAGED
    'type': 'move',
    'has_receipt': True
}

# 4. Run Checks
test_cases = [
    ("Normal Move", trx_normal),
    ("3 AM Violation", trx_hard_rule),
    ("Massive Theft", trx_ai_anomaly),
    ("Damage Report", trx_damage)
]

for name, trx in test_cases:
    result = agent.analyze_transaction(trx)
    print(f"\nChecking: {name}...")
    print(f"STATUS:  {result['status']}")
    if result['status'] != "APPROVED":
        print(f"REASON:  {result['reasons'][0]}")
        print(f"CONTEXT: {result['rag_context']}")
    else:
        print("REASON:  Transaction looks safe.")
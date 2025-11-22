# StockMaster - Intelligent Inventory Management

StockMaster is a next-generation warehouse management system powered by a multi-agent AI architecture. It combines traditional ERP capabilities with predictive analytics and anomaly detection.

## 🚀 Features

- **Real-time Inventory Tracking**: Monitor stock levels across multiple warehouses.
- **AI Agent 1 (Stock Oracle)**: Natural language interface for database operations.
- **AI Agent 2 (Predictive Guardian)**: LSTM-based forecasting to prevent stockouts.
- **AI Agent 3 (Anomaly Sentinel)**: Fraud and error detection using Isolation Forests.
- **Role-Based Access**: Secure login for Managers and Staff.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, Socket.io
- **AI Engine**: Python (FastAPI, PyTorch, Scikit-Learn)
- **Database**: PostgreSQL with pgvector

## 🏃‍♂️ Running Locally

1. **Backend**:
   ```bash
   cd stock-oracle-backend
   npm run dev
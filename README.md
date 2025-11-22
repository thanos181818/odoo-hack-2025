# StockMaster – Intelligent Autonomous Inventory Management System with AI Agents

## Team Members
- **Sahil Mehta**
- **Raj Mathuria**
- **Palash Shah**
- **Reyansh Mehta**

## Reviewer
- **Aman Patel**

## Video Link
https://drive.google.com/drive/folders/1Dhb-eGut8ded265uEG_fEm41Cs6ptLUS?usp=sharing

## 1. Project Overview
StockMaster is a real-time, multi-warehouse inventory management system that goes beyond traditional digitization of manual processes. It introduces an **autonomous inventory brain** powered by three specialized AI agents and Retrieval-Augmented Generation (RAG) that actively predict, prevent, and resolve issues before human intervention is required.

The system provides a single source of truth for stock across multiple warehouses and rack-level locations while delivering proactive intelligence through natural-language interaction, predictive forecasting, and real-time anomaly detection.

**Signature Experience:**  
User types:  
> “Steel is running low in Production Rack and we have a big order tomorrow.”

StockMaster instantly responds and acts:  
> “Predicted depletion in 11 hours → Draft receipt for 200 kg from Vendor ABC created → Optimal internal transfer route calculated → Anomaly check passed → Ready for your approval.”

## 2. Core Features (Standard IMS Requirements)  
- Real-time dashboard with live KPIs and dynamic filters  
- Complete operations: Receipts → Delivery Orders → Internal Transfers → Stock Adjustments  
- Full multi-warehouse + rack-level location support  
- Comprehensive audit trail (Move History & Stock Ledger)  
- Product management with SKU, categories, and reorder rules  
- All stock updates atomic and real-time via WebSockets  

## 3. Database Architecture
**Primary Database:** PostgreSQL with pgvector extension (Hybrid relational + vector)

| Requirement                  | Solution Chosen                      | Benefit                                           |
|------------------------------|--------------------------------------|---------------------------------------------------|
| Relational transactions      | PostgreSQL                           | Full ACID compliance for stock accuracy          |
| Real-time queries & filters  | Proper indexing + materialized views | Sub-100 ms KPI refreshes                         |
| Semantic search & RAG        | pgvector (1536-dim embeddings)       | No separate vector DB → minimal complexity       |
| Scalability & security       | Row-level security, connection pooling | Enterprise-ready from day one                   |
| Future-proofing              | Same DB for structured + unstructured data | Easy extension to images, PDFs, chat history    |

**Result:** A single PostgreSQL instance serves as both relational store and vector store — simplest, fastest, and most reliable setup.

## 4. The Three Autonomous AI Agents (Core Differentiator)
All agents share the same live RAG knowledge base derived from the database → **zero hallucination, 100% data accuracy**.

### Agent 1 – Stock Oracle (Conversational Reasoning Brain)
**Role:** Natural-language interface and execution engine for the entire system.  
**Operation:**  
- Uses pgvector to retrieve semantically relevant live data snapshots  
- Combines retrieved context + user prompt → sends to LLM (GPT-4o mini / Claude 3.5 Sonnet)  
- Uses function calling to execute backend operations securely  

**Capabilities:**  
- Instant answers to any stock-related question  
- Direct execution via natural language (“Transfer 50 units of Chairs to Production Floor”)  
- Multi-step reasoning grounded in real-time data  

**Tech:** LangChain.js + OpenAI/Claude + pgvector + function calling

### Agent 2 – Predictive Guardian (Demand Forecaster)
**Role:** Continuously monitors consumption and predicts depletion.  
**Operation:**  
Hybrid forecasting model combining:  
- LSTM (PyTorch) – captures complex non-linear patterns  
- Prophet (Meta) – handles seasonality, holidays, and trends  

Runs daily → generates 30-day demand forecasts per product-location.

**Capabilities:**  
- Daily depletion forecasting  
- Smart reorder suggestions  
- “What-if” scenario simulation  
- Proactive low-stock alerts  

**Tech:** Python + PyTorch LSTM + Prophet hybrid ensemble

### Agent 3 – Anomaly Sentinel (Fraud & Error Detector)
**Role:** Real-time monitoring of every transaction for irregularities.  
**Operation:**  
Combines:  
- Isolation Forest (efficient outlier detection)  
- One-Class SVM (trained only on normal data)  
- Simple threshold rules  

Suspicious operations are automatically paused and sent for manager approval.

**Capabilities:**  
- Flags unusual patterns in real time (e.g., large adjustment at 3 AM, unmatched transfers)  
- Semi-supervised learning from confirmed anomalies  
- Prevents errors and fraud before they impact stock  

**Tech:** Scikit-learn Isolation Forest + One-Class SVM + rule engine

## 5. UI/UX Design Principles

| Element              | Technology / Design Choice                                      |
|----------------------|-----------------------------------------------------------------|
| Framework            | React + Vite + Tailwind CSS + ShadCN UI + Lucide icons          |
| Theme                | Dark mode first + light mode toggle                             |
| Layout               | Left sidebar + top KPI cards + main content area                |
| Real-time updates    | Socket.io (animated counters)                                   |
| AI Chat              | Floating orb → expands to full chat (Intercom style)            |
| Forms                | Multi-step, mobile-responsive, live SKU search                  |
| Tables               | TanStack Table with virtualization, filtering, pinning         |
| Dashboard Widgets    | Predictive cards, anomaly alerts, reorder suggestions          |
| Mobile               | Fully responsive — staff can validate receipts on phone         |

## 6. Full Technical Stack

| Layer                | Technology                                                                 |
|----------------------|----------------------------------------------------------------------------|
| Frontend             | Next.js App Router + React + TypeScript + Tailwind + ShadCN + TanStack Table |
| Backend              | Node.js + Express + TypeScript + Prisma ORM                                |
| Database             | PostgreSQL + pgvector                                                      |
| Authentication       | JWT + OTP (email/mock)                                                     |
| Real-time            | Socket.io                                                                  |
| AI Agents & RAG      | LangChain.js + OpenAI/Claude + pgvector                                    |
| Predictive ML Agent  | Python + PyTorch + Prophet + Scikit-learn                                  |
| Deployment           | Frontend: Vercel • Backend + DB: Railway / Render / Neon (with pgvector)   |



# StockMaster — Plan of Action (Final MD Version)

A complete, structured, time-agnostic plan of action for building **StockMaster**, merging requirements from the **Grok Report** and the **Official StockMaster.pdf**. This document contains *only the plan* (no code), in clean Markdown format.

---

## 1. Project Overview
StockMaster is a next-gen, AI-powered multi-warehouse Inventory Management System that combines:
- Traditional IMS operations (receipts, deliveries, transfers, adjustments)
- Real-time KPIs and dashboards
- Proper warehouse/rack structure
- Robust database with audit trails
- Three autonomous AI agents using RAG + forecasting + anomaly detection

This plan outlines the end-to-end steps to implement the system.

---

## 2. System Architecture
StockMaster consists of three coordinated layers:

### **2.1 Frontend Layer**
- React + Vite + Tailwind + ShadCN UI
- TanStack Table for complex filtering and virtual scrolling
- Socket-enabled live dashboards
- Floating AI orb → full chat window
- Fully responsive layout for warehouse staff

### **2.2 Backend Layer**
- Node.js + Express
- PostgreSQL (ACID-safe inventory logic)
- pgvector extension for semantic RAG search
- Prisma ORM
- JWT-based authentication + OTP reset
- WebSockets for real-time updates

### **2.3 AI Layer**
Three cooperating agents:
1. **Stock Oracle** — natural-language interface + action execution
2. **Predictive Guardian** — consumption forecasting and reorder suggestions
3. **Anomaly Sentinel** — fraud/error detection and automated safety checks

---

## 3. Core Functional Modules
The entire IMS is structured into the following modules.

### **3.1 Authentication & User Management**
- Signup, login, OTP reset
- JWT-based sessions
- Manager and Staff roles
- Profile Menu: My Profile + Logout

### **3.2 Warehouse & Location Management**
- Create/edit/delete warehouses
- Rack-level stock locations
- Location hierarchy (Warehouse → Racks)

### **3.3 Product Management**
- Product creation/update
- SKU, category, UoM, optional initial stock
- Reorder rules
- Product-location availability views

### **3.4 Inventory Operations**
- **Receipts:** incoming goods, validation increases stock
- **Delivery Orders:** picking + packing + sending decreases stock
- **Internal Transfers:** stock movement between racks/warehouses
- **Stock Adjustments:** cycle counts, damaged goods, corrections
- **Stock Ledger / Move History:** complete immutable audit trail

### **3.5 Dashboard & KPIs**
- Total products
- Low/out-of-stock items
- Pending receipts and deliveries
- Scheduled internal transfers
- Live KPIs via WebSockets
- Predictive cards from AI
- Anomaly alerts

### **3.6 Dynamic Filters**
- Document type: receipt / delivery / adjustments / transfers
- Status: draft, waiting, ready, done, canceled
- Warehouse / rack
- Product category

---

## 4. Data Architecture
The system’s database handles both structured and vector data.

### **4.1 Relational Tables**
- Users
- Warehouses
- Stock locations (racks)
- Products
- Stock quants (product-location quantities)
- Stock moves (ledger)
- Receipts & deliveries
- Internal transfers
- Stock adjustments

### **4.2 Vector Storage**
- Central RAG knowledge base storing:
  - Product descriptions
  - Stock snapshots
  - Recent operations
  - User actions
- Used by Stock Oracle for reasoning & contextual answering

---

## 5. Real-Time System Behavior
The following events trigger automatic client updates:
- Receipt validation
- Delivery completion
- Transfer confirmations
- Adjustments
- Forecast changes
- Anomaly triggers

Dashboard widgets update instantly, creating a “live warehouse” effect.

---

## 6. AI Agent Responsibilities
StockMaster includes three cooperating agents, each with distinct roles and shared RAG memory.

### **6.1 Stock Oracle (Conversational Brain)**
- Answers natural questions about stock, history, and operations
- Executes actions through backend APIs
- Supports multi-step reasoning
- Uses embeddings + RAG to avoid hallucinations

### **6.2 Predictive Guardian (Forecaster)**
- Analyzes historical consumption
- Predicts depletion time for each product/rack
- Generates reorder suggestions
- Provides “what-if” simulations

### **6.3 Anomaly Sentinel (Fraud & Error Detector)**
- Flags suspicious activity:
  - Large unexpected adjustments
  - Transfers without corresponding receipts/deliveries
  - Off-hours operations
  - Sudden surge in damaged items
- Auto-pauses operations for manager approval
- Learns from confirmed anomalies

---

## 7. UX Guidelines
The interface must feel modern, fast, and judgement-ready.

### **7.1 Visual Style**
- Dark mode first
- Clean left sidebar navigation
- Lucide icons
- Smooth micro-interactions (hover, transitions)

### **7.2 Usability Principles**
- Multi-step forms
- Instant search for SKUs
- Keyboard shortcuts
- Mobile usability for warehouse staff

### **7.3 AI Integration**
- Floating orb → expandable chat pane
- Inline suggestions in forms (AI-powered)
- Predictive and anomaly widgets on dashboard

---

## 8. Final Demo Flow (Judges Sequence)
1. **Speak to AI:** “Steel is running low in Rack B.”
2. Stock Oracle predicts depletion, drafts receipt, proposes transfer.
3. Predictive Guardian displays “Runs out in X days”.
4. Validate receipt → live KPI updates.
5. Trigger anomaly scenario → Anomaly Sentinel pauses suspicious activity.
6. Judges witness autonomous warehouse behavior.

---

## 9. Project Deliverables
- Fully working IMS with all modules
- Real-time dashboard
- Three AI agents with shared RAG memory
- Multi-warehouse, rack-level stock engine
- Responsive UI
- Complete audit trail
- Secure authentication with OTP
- A polished, judge-ready narrative

---

## 10. Vision Summary
StockMaster is not just another inventory system — it is the **first autonomous warehouse brain**, combining real-time logistics with intelligent agents that prevent problems before they occur.

This plan outlines everything required to build that vision.

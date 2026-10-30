# 🏥 Q-Transplant v4 — National Organ Transplant Allocation & Intelligence System

**Team 13 | Mini Project III 2026-27**
**Department of Computer Science & Engineering (Artificial Intelligence)**
**UG B.Tech CSE AI**

---

## 👥 Team Members

| Name | Roll Number | Department |
|------|-------------|------------|
| **Aravindh A** | 24623134 | UG B.Tech CSE AI |
| **Jovin Roy S** | 24623116 | UG B.Tech CSE AI |
| **Priyan E** | 24623122 | UG B.Tech CSE AI |

---

## 📌 Project Title

**Q-Transplant v4 — Real-Time National Organ Transplant Allocation & Intelligence System**

---

## 📖 Abstract

Q-Transplant is a fully-integrated national organ transplant allocation platform combining **real-time ischemia decay tracking**, **GIS-based transport logistics**, **6-locus HLA crossmatch compatibility scoring**, **SHA-256 tamper-evident audit ledger**, and an **OrganPulse AI Clinical Assistant**. The system enables hospitals to register donors, search for compatible recipients across the national network, and confirm organ allocation — all in real time.

---

## 🚀 Key Features

- ⏱️ **Real-Time Organ Viability Decay** — Heart (4h), Lung (6h), Liver (12h), Kidney (24h)
- 🗺️ **GIS Transport Logistics** — Haversine geodesic distance, ground vs air routing
- 🧬 **6-Locus HLA Crossmatch Engine** — HLA-A, B, C, DR, DQ, DP with PRA% scoring
- 🤖 **OrganPulse AI Clinical Assistant** — Groq LLaMA 3.1 powered
- 🔐 **SHA-256 Tamper-Evident Audit Ledger** — Blockchain-style chaining
- 📊 **System Database Explorer** — Root organizer live SQL table viewer
- 🏥 **Multi-Hospital Architecture** — JWT role-based access control

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.11) |
| Database | SQLite + SQLAlchemy ORM |
| Authentication | JWT (HS256) |
| AI Assistant | Groq LLaMA 3.1 + Fallback Engine |
| Frontend | Vanilla JS + CSS (Claymorphism SPA) |
| Cryptography | SHA-256 Audit Ledger |
| GIS | Haversine Formula |

---

## 📁 Repository Structure

```
TEAM-13---ARAVINDH/
├── CODE/           → Full source code (zip) + README
├── DOCUMENTATION/  → Project documentation
├── PAPER/          → Research paper / report
├── PPT/            → Presentation slides
└── README.md       → This file
```

---

## ▶️ Quick Start

```bash
# Clone and run
git clone https://github.com/Aravindh-coder/Q-transplant-mini-project2026.git
cd Q-transplant-mini-project2026/backend/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Open http://localhost:8000
```

**Login:** `root@qtransplant.org` / `root123`

---

## 🔗 Links

- **Personal Repo:** [github.com/Aravindh-coder/Q-transplant-mini-project2026](https://github.com/Aravindh-coder/Q-transplant-mini-project2026)
- **Class Repo:** [github.com/AIML2026-27/MINI-PROJECT-III-AI](https://github.com/AIML2026-27/MINI-PROJECT-III-AI/tree/TEAM-13---ARAVINDH)

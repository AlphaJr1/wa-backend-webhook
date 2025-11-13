# WA Backend Webhook

A lightweight Node.js webhook backend for the WhatsApp Cloud API.  
This service receives incoming WhatsApp messages, validates webhook events, and forwards them to the KLAR RAG FastAPI engine for processing.

Supports:
- Webhook verification (GET)
- Receiving WhatsApp messages (POST)
- Forwarding text messages to FastAPI `/chat`
- Logging and basic debugging output

---

## 🚀 Features

- Simple Express-based webhook server  
- Compatible with WhatsApp Cloud API v20+  
- Secure webhook token validation  
- FastAPI integration with automatic forwarding  
- Clean logging (no spam)  
- `.env` support for secrets and tokens  

---

## 📦 Requirements

- Node.js ≥ 16  
- NPM  
- WhatsApp Cloud API app (Meta Developers)  
- KLAR RAG FastAPI backend running behind a reachable URL (Cloudflare tunnel or public URL)

---

## 🛠 Installation

Clone the repository:

```bash
git clone https://github.com/AlphaJr1/wa-backend-webhook.git
cd wa-backend-webhook

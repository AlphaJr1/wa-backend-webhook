# WA Backend Webhook

A lightweight and clean Node.js webhook backend for the WhatsApp Cloud API.
This service receives incoming WhatsApp messages, validates webhook events, and forwards them to the KLAR RAG FastAPI RAG engine for processing.

---

## 🚀 Features

* Webhook verification for WhatsApp Cloud API (GET)
* Handles incoming WhatsApp messages (POST)
* Forwards text messages to FastAPI `/chat` endpoint
* Clean logging with no clutter
* Auto-documentation via Swagger UI (`/docs`)
* Easy local testing via Postman / Hoppscotch
* `.env` support for secure configuration

---

## 📦 Requirements

* Node.js ≥ 16
* npm
* WhatsApp Cloud API app (Meta Developers)
* FastAPI backend with `/chat` route
* Optional: Cloudflare Tunnel for public URL

---

## 🛠 Installation

Clone the repository:

```bash
git clone https://github.com/AlphaJr1/wa-backend-webhook.git
cd wa-backend-webhook
```

Install dependencies:

```bash
npm install
```

If using nodemon (recommended):

```bash
npm install -D nodemon
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```
PORT=3000
VERIFY_TOKEN=testtoken123
FORWARD_URL=https://your-fastapi-url/chat
```

### Explanation

| Variable       | Description                               |
| -------------- | ----------------------------------------- |
| `PORT`         | Webhook server port                       |
| `VERIFY_TOKEN` | Token used by Meta to verify your webhook |
| `FORWARD_URL`  | FastAPI `/chat` endpoint URL              |

> Note: `.env` is ignored by Git to keep secrets safe.

---

## ▶️ Running the Server

### Development mode

```bash
npx nodemon server.js
```

### Production mode

```bash
node server.js
```

Expected startup output:

```
WA Backend Webhook Server
----------------------------------------
Port            : 3000
Verify Token    : testtoken123
Forwarding To   : https://your-fastapi-url/chat
Swagger Docs    : http://localhost:3000/docs
----------------------------------------
```

---

## 📚 API Documentation (Swagger)

After running the server, open:

👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

Swagger includes:

* Webhook verification (GET `/webhook`)
* Message receiver (POST `/webhook`)
* Health check
* Example WhatsApp payloads
* FastAPI forwarding explanation

You can also import the generated OpenAPI JSON into Postman / Hoppscotch.

---

## 🔗 WhatsApp Webhook Setup (Meta)

Inside Meta Developer Console:

1. Go to **WhatsApp → Configuration**
2. Set **Webhook URL** to your public server or Cloudflare URL
   Example:
   `https://your-tunnel-url.trycloudflare.com/webhook`
3. Set **Verify Token** (must match your `.env`)
4. Enable events:

   * `messages`
   * `message_status`
5. Click **Verify & Save**

---

## 🧪 Testing the API

### 1️⃣ Test Webhook Verification (GET)

```
GET http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=testtoken123&hub.challenge=123456
```

Expected response:

```
123456
```

---

### 2️⃣ Test Incoming Message (POST)

Use Postman / Hoppscotch:

```
POST http://localhost:3000/webhook
Content-Type: application/json
```

Body:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "TEST_WABA",
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "628123456789",
                "id": "wamid.HERE",
                "timestamp": "1700000000",
                "type": "text",
                "text": { "body": "Hello" }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

Expected terminal output:

```
[WEBHOOK] Text received from 628123456789: "Hello"
[FASTAPI] Response OK: { bubbles: [...], next: 'await_reply', ... }
```

---

## 🔄 How the System Works

Here’s the internal flow:

1. WhatsApp Cloud API sends a message → `/webhook`
2. Server validates event payload
3. Extracts sender + message body
4. Forwards the message to FastAPI:

   ```
   POST FORWARD_URL
   {
     "user_id": "<phone_number>",
     "text": "<message>"
   }
   ```
5. Logs FastAPI’s response

(The backend does not auto-reply to WhatsApp unless extended.)

---

## 📁 Project Structure

```
wa-backend-webhook/
│── server.js
│── package.json
│── package-lock.json
│── .gitignore
│── .env              (ignored)
└── node_modules/
```

---

## 📝 Notes

* `server.js` can be extended to send responses directly to WhatsApp Cloud API
* Make sure Cloudflare tunnel URL stays active during testing
* Logs are intentionally clean for readability
* Swagger annotations do not affect runtime

---

## 🧩 Future Extensions

* Send generated responses back to WhatsApp users
* Store chat history with Redis / MongoDB
* Add signature validation (`X-Hub-Signature`)
* Add rate limiting / monitoring

---

## 👤 Maintainer

**Adrian Alfajri (AlphaJr)**
WhatsApp AI Backend Development · KLAR RAG Engine
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

// CONFIGURATION

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "testtoken123";

// FastAPI Endpoint
const FASTAPI_BASE_URL = "https://boost-reasonably-approximately-induction.trycloudflare.com";
const FASTAPI_CHAT_URL = `${FASTAPI_BASE_URL}/chat`;

// HELPER FUNCTION: Forward message to FastAPI

async function forwardToFastAPI(userId, text) {
  try {
    const payload = {
      user_id: userId,
      text: text
    };

    const response = await axios.post(FASTAPI_CHAT_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    });

    console.log("[FASTAPI] Response OK:", response.data);
    return response.data;
  } catch (error) {
    console.error("[FASTAPI] Error:", error.response?.data || error.message);
    return null;
  }
}

// WHATSAPP WEBHOOK VERIFICATION (GET)

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[WEBHOOK] Verified successfully.");
    return res.status(200).send(challenge);
  }

  console.log("[WEBHOOK] Verification failed.");
  res.sendStatus(403);
});

// WHATSAPP WEBHOOK RECEIVER (POST)

app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.status(200).json({ received: true });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages) {
      return res.status(200).json({ received: true });
    }

    for (const msg of messages) {
      if (msg.type !== "text") {
        console.log("[WEBHOOK] Ignored non-text message.");
        continue;
      }

      const from = msg.from;           // phone number
      const text = msg.text.body;      // message text

      console.log(`[WEBHOOK] Text received from ${from}: "${text}"`);

      // Forward to FastAPI
      await forwardToFastAPI(from, text);
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("[WEBHOOK] Error:", error.message);
    res.status(500).json({ error: "internal_error" });
  }
});

// HEALTH CHECK

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "1.0.0",
    fastapi_url: FASTAPI_BASE_URL,
    webhook: "/webhook",
    note: "WhatsApp Webhook → FastAPI bridge operational."
  });
});


app.listen(PORT, () => {
  console.log("-------------------------------------------");
  console.log(" WA Backend Webhook Server");
  console.log("-------------------------------------------");
  console.log(` Port            : ${PORT}`);
  console.log(` Verify Token    : ${VERIFY_TOKEN}`);
  console.log(` Forwarding To   : ${FASTAPI_CHAT_URL}`);
  console.log("-------------------------------------------");
});

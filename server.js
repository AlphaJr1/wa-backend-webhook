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

/**
 * @openapi
 * /webhook:
 *   get:
 *     summary: Verify WhatsApp Webhook Subscription
 *     description: Meta sends a GET request to verify your webhook using the VERIFY_TOKEN.
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verified successfully.
 *       403:
 *         description: Verification failed. Invalid token.
 */

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

/**
 * @openapi
 * /webhook:
 *   post:
 *     summary: Receive WhatsApp webhook events
 *     description: Handles incoming WhatsApp Cloud API messages and forwards text messages to FastAPI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               object: "whatsapp_business_account"
 *               entry:
 *                 - id: "WHATSAPP_BUSINESS_ID"
 *                   changes:
 *                     - value:
 *                         messages:
 *                           - from: "62812345678"
 *                             id: "wamid.ID"
 *                             timestamp: "1694000000"
 *                             text:
 *                               body: "Hello"
 *                             type: "text"
 *                       field: "messages"
 *     responses:
 *       200:
 *         description: Webhook processed successfully.
 *       500:
 *         description: Internal server error.
 */

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

/**
 * @openapi
 * /:
 *   get:
 *     summary: Health check for WA Backend
 *     description: Returns basic service info and FastAPI forwarding status.
 *     responses:
 *       200:
 *         description: Service is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

app.get("/", (req, res) => {
  res.json({
    status: "running",
    version: "1.0.0",
    fastapi_url: FASTAPI_BASE_URL,
    webhook: "/webhook",
    note: "WhatsApp Webhook → FastAPI bridge operational."
  });
});

// SWAGGER DOCUMENTATION
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WA Backend Webhook API",
      version: "1.0.0",
      description:
        "Documentation for WhatsApp Webhook Backend that receives messages from WhatsApp Cloud API and forwards them to a FastAPI RAG engine."
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local Development Server"
      }
    ]
  },
  apis: ["./server.js"]
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(PORT, () => {
  console.log("-------------------------------------------");
  console.log(" WA Backend Webhook Server");
  console.log("-------------------------------------------");
  console.log(` Port            : ${PORT}`);
  console.log(` Verify Token    : ${VERIFY_TOKEN}`);
  console.log(` Forwarding To   : ${FASTAPI_CHAT_URL}`);
  console.log("-------------------------------------------");
});

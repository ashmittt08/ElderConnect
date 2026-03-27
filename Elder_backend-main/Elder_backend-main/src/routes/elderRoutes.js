import express from "express";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";
import Request from "../models/Request.js";
import OpenAI from "openai";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// CREATE REQUEST
router.post(
  "/request",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      console.log("📥 ELDER REQUEST BODY:", req.body);

      const { type, description } = req.body;

      if (!type || !description) {
        return res.status(400).json({ message: "Missing fields" });
      }

      const request = await Request.create({
        elder: req.user._id,
        type,
        description,
        // status: "pending",
      });

      res.status(201).json(request);
    } catch (err) {
      console.error("❌ CREATE REQUEST ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


router.get(
  "/requests",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const requests = await Request.find({
        elder: req.user._id,
      }).sort({ createdAt: -1 });

      res.json(requests);
    } catch (err) {
      console.error("❌ FETCH MY REQUESTS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  }
);

// AI COMPANION CHAT
router.post(
  "/chat",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === "your_key_here") {
        return res.status(500).json({ message: "Groq API key is missing. Please configure GROQ_API_KEY in the backend .env file." });
      }

      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      const messages = [
        {
          role: "system",
          content: "You are a friendly AI companion for elderly users of the ElderConnect app. CRITICAL: Keep replies to 1-2 sentences MAX. Be warm but extremely concise and to the point. If the user writes in Hindi, reply in Hindi. If English, reply in English. If Hinglish, reply in Hinglish."
        },
        ...(history || []),
        { role: "user", content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages,
      });

      const reply = completion.choices[0].message.content;
      res.status(200).json({ reply });
    } catch (err) {
      console.error("❌ ELDER CHAT ERROR:", err?.message || err);
      console.error("❌ FULL ERROR:", JSON.stringify(err?.response?.data || err?.error || err, null, 2));
      
      // Send a fallback message if API fails
      res.status(200).json({ reply: "I'm having a bit of trouble connecting right now, but I'm here for you! Please try again in a moment." });
    }
  }
);

export default router;

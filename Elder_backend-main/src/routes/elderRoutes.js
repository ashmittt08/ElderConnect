import express from "express";
import verifyUser from "../middleware/verifyUser.js";
import requireRole from "../middleware/requireRole.js";
import Request from "../models/Request.js";
import User from "../models/User.js";
import OpenAI from "openai";

const router = express.Router();

let openai = null;
function getOpenAI() {
  if (!openai && process.env.GROQ_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return openai;
}

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

// GET NEAREST NGOs (Text-based address matching)
router.get(
  "/nearest-ngos",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const elderId = req.user._id;
      const elder = await User.findById(elderId);

      if (!elder) return res.status(404).json({ message: "Elder not found" });

      // Get all approved NGOs
      const ngos = await User.find({ role: "ngo", approved: true }).select(
        "name address phone profilePhoto email"
      );

      const elderAddress = (elder.address || "").toLowerCase();
      const addrParts = elderAddress.split(',').map(p => p.trim());
      const elderCity = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : null;

      // Simple pseudo-matching: prioritize NGOs with overlapping address words
      const elderWords = elderAddress.split(/[,\s]+/).filter(w => w.length > 3);

      const scoredNgos = ngos.map((ngo) => {
        let score = 0;
        const ngoAddress = (ngo.address || "").toLowerCase();
        
        // Boost score if city matches
        if (elderCity && ngoAddress.includes(elderCity)) {
          score += 10;
        }

        elderWords.forEach(word => {
          if (ngoAddress.includes(word)) score += 1;
        });

        // Add small random noise to shuffle ties
        score += Math.random() * 0.1;
        
        return { ngo, score };
      });

      // Sort by score descending and take top 3
      scoredNgos.sort((a, b) => b.score - a.score);
      
      const topNgos = scoredNgos.slice(0, 3).map(n => n.ngo);

      res.status(200).json(topNgos);
    } catch (err) {
      console.error("❌ FETCH NEAREST NGOS ERROR:", err);
      res.status(500).json({ message: "Server error" });
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

      const client = getOpenAI();
      if (!client) {
        return res.status(200).json({ reply: "AI chat is not configured. Please set GROQ_API_KEY." });
      }

      const completion = await client.chat.completions.create({
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

// GET ALL NGOs
router.get(
  "/ngos",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const user = req.user;
      let query = { role: "ngo", approved: true };

      // If user has address, try to filter by city (assuming locality, city, state format)
      if (user.address) {
        const parts = user.address.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          const city = parts[parts.length - 2];
          if (city) {
            query.address = { $regex: city, $options: 'i' };
          }
        }
      }

      const ngos = await User.find(query).select(
        "name address phone profilePhoto email"
      );
      res.status(200).json(ngos);
    } catch (err) {
      console.error("❌ FETCH NGOS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch NGOs" });
    }
  }
);

// JOIN NGO (Elder joins a single NGO)
router.post(
  "/join-ngo/:ngoId",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const ngoId = req.params.ngoId;
      const elderId = req.user._id;

      const ngo = await User.findById(ngoId);
      if (!ngo || ngo.role !== "ngo") {
        return res.status(404).json({ message: "NGO not found" });
      }

      await User.findByIdAndUpdate(elderId, { joinedNGO: ngoId });

      res.status(200).json({ message: "Successfully joined NGO" });
    } catch (err) {
      console.error("❌ JOIN NGO ERROR:", err);
      res.status(500).json({ message: "Failed to join NGO" });
    }
  }
);

// GET MY JOINED NGO
router.get(
  "/my-ngos",
  verifyUser,
  requireRole("elder"),
  async (req, res) => {
    try {
      const elder = await User.findById(req.user._id).populate("joinedNGO", "name address phone profilePhoto email");
      if (!elder.joinedNGO) {
        return res.json([]);
      }
      res.json([elder.joinedNGO]);
    } catch (err) {
      console.error("❌ FETCH MY NGOS ERROR:", err);
      res.status(500).json({ message: "Failed to fetch joined NGO" });
    }
  }
);

export default router;

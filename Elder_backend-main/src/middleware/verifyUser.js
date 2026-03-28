import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const verifyUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const user = await User.findOne({ uid: decoded.uid });

    if (!user) {
      return res.status(200).json( null );
    }

    req.user = user;   // 🔥 MONGO USER DOC
    console.log("VERIFY USER HIT");

    next();
  } catch (err) {
    console.error("VERIFY USER ERROR:", err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

export default verifyUser;

// import admin from "../../firebase.js";

// export const verifyUser = async (req,res,next)=>{
//   try{
//     const token = req.headers.authorization?.split(" ")[1];
//     if(!token) return res.status(401).json({ message:"No token" });

//     const decoded = await admin.auth().verifyIdToken(token);
//     req.userId = decoded.uid;
//     req.email = decoded.email;
//     next();
//   }catch(e){
//     return res.status(401).json({ message:"Invalid token" });
//   }
// }

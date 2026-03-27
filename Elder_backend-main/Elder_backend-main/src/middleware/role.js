import User from "../models/User.js";

export const requireRole = (...allowedRoles) => {
  return async (req,res,next)=>{
    try{
      const user = await User.findOne({ firebaseId:req.userId });

      if(!user){
        return res.status(404).json({ message:"User not found" });
      }

      if(!allowedRoles.includes(user.role)){
        return res.status(403).json({
          message:"Access Denied: Insufficient Permissions"
        });
      }

      req.role = user.role;
      next();

    }catch(e){
      console.log(e);
      res.status(500).json({ message:"Server Error" });
    }
  }
};

import User from "../models/User.js";

export const getAllUsers = async(req,res)=>{
  try{
    const users = await User.find();
    res.json(users);
  }catch(e){
    res.status(500).json({message:"Server Error"});
  }
};

export const getUsersByRole = async(req,res)=>{
  try{
    const role = req.params.role;
    const users = await User.find({ role });
    res.json(users);
  }catch(e){
    res.status(500).json({message:"Server Error"});
  }
};

export const approveNGO = async(req,res)=>{
  try{
    await User.findByIdAndUpdate(req.params.id,{
      ngoApproved:true
    });

    res.json({success:true,message:"NGO Approved"});
  }catch(e){
    res.status(500).json({message:"Server Error"});
  }
};

export const updateStatus = async(req,res)=>{
  try{
    const { status } = req.body;

    await User.findByIdAndUpdate(req.params.id,{
      status
    });

    res.json({success:true,message:"User Status Updated"});
  }catch(e){
    res.status(500).json({message:"Server Error"});
  }
};

export const deleteUser = async(req,res)=>{
  try{
    await User.findByIdAndDelete(req.params.id);
    res.json({success:true,message:"User Deleted"});
  }catch(e){
    res.status(500).json({message:"Server Error"});
  }
};

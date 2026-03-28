import User from "../models/User.js";

export const registerElder = async(req,res)=>{
  try{
    const { uid, name, age, address, phone, needs } = req.body;

    await User.findOneAndUpdate(
      { firebaseId: uid },
      {
        firebaseId: uid,
        role:"elder",
        name,
        age,
        address,
        phone,
        needs,
        profileCompleted:true
      },
      { upsert:true }
    );

    res.json({ success:true, message:"Elder Registered" });

  }catch(e){
    console.log(e);
    res.status(500).json({ message:"Server Error" });
  }
};


export const registerVolunteer = async(req,res)=>{
  try{
    const { uid, name, email, phone, skills, availability } = req.body;

    await User.findOneAndUpdate(
      { firebaseId: uid },
      {
        firebaseId: uid,
        role:"volunteer",
        name,
        email,
        phone,
        skills,
        availability,
        profileCompleted:true
      },
      { upsert:true }
    );

    res.json({ success:true, message:"Volunteer Registered" });

  }catch(e){
    console.log(e);
    res.status(500).json({ message:"Server Error" });
  }
};


export const registerNGO = async(req,res)=>{
  try{
    const { uid, orgName, email, phone, address, description } = req.body;

    await User.findOneAndUpdate(
      { firebaseId: uid },
      {
        firebaseId: uid,
        role:"ngo",
        orgName,
        email,
        phone,
        address,
        description,
        profileCompleted:true
      },
      { upsert:true }
    );

    res.json({ success:true, message:"NGO Registered" });

  }catch(e){
    console.log(e);
    res.status(500).json({ message:"Server Error" });
  }
};

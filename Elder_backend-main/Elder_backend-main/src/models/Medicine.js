import mongoose from "mongoose"

const med = new mongoose.Schema({
  userId:String,
  medicineName:String,
  description:String,
  status:{
    type:String,
    enum:["pending","assigned","completed"],
    default:"pending"
  },
  assignedVolunteer:String,
  location:{
    type:{
      type:String,
      enum:["Point"],
      default:"Point"
    },
    coordinates:[Number]
  }
})

med.index({ location:"2dsphere" })

export default mongoose.model("Medicine",med)

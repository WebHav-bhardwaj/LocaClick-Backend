const { Schema, model, default: mongoose } = require("mongoose");
const geocoder = require("../utils/geocoder");

const placeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      lat: Number ,
      lng: Number ,
      // index: "2dsphere",
    },
  },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

placeSchema.pre("save", async function (next) {
  let loc;
  try {
    loc = await geocoder.geocode(this.address);
  } catch (error) {
    console.log(error.message);
  }
  this.location = {
    // type: "Point",
    coordinates: { lng: loc[0].longitude, lat: loc[0].latitude },
  };
  next();
});

module.exports = model("Place", placeSchema);

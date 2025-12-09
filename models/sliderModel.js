import mongoose from "mongoose";

const sliderSchema = new mongoose.Schema({
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  imageTitle: { type: String, required: true, trim: true, maxlength: 100 },
  imageDescription: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  buttonTitle: { type: String, required: true, trim: true, maxlength: 50 },
  buttonLink: { type: String, required: true, trim: true, default: "/" },
  imageIndex: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    unique: true,
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sliderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Limit to 5 sliders
sliderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Slider").countDocuments();
    if (count >= 5) {
      throw new Error("Maximum 5 sliders allowed");
    }
  }
  next();
});

export default mongoose.model("Slider", sliderSchema);

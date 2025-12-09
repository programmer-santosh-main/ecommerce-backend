// models/seoModel.js
import mongoose from "mongoose";

const SeoSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, unique: true },
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
    image: { type: String, default: "" },
    url: { type: String, default: "" },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} }, // for additional meta
  },
  { timestamps: true }
);

const Seo = mongoose.model("Seo", SeoSchema);
export default Seo;

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true },
    sku: { type: String, unique: true },
    brand: { type: String },
    attributes: [{ key: String, value: String }],

    // 🖼️ Cloudinary image info with index
    images: [
      {
        index: { type: Number },
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],

    seoTitle: String,
    seoDescription: String,
    canonicalUrl: String,
    metaKeywords: [String],
    tags: [String],
    featuredKeywords: [String],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);

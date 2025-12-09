import Product from "../models/productModel.js";
import cloudinary from "../config/cloudinary.js";

// 🛠 Helper to upload images to Cloudinary
const uploadImagesToCloudinary = async (files) => {
  const uploadedImages = [];
  for (let i = 0; i < files.length && i < 3; i++) {
    const result = await cloudinary.uploader.upload(files[i].tempFilePath, {
      folder: "ecommerce/products",
    });
    uploadedImages.push({
      index: i,
      public_id: result.public_id,
      url: result.secure_url,
    });
  }
  return uploadedImages;
};

// 🆕 Create Product
export const createProduct = async (req, res) => {
  try {
    let data = { ...req.body };

    // 🧠 Parse attributes if stringified
    if (typeof data.attributes === "string") {
      try {
        data.attributes = JSON.parse(data.attributes);
      } catch {
        data.attributes = [];
      }
    }

    ["metaKeywords", "tags", "featuredKeywords"].forEach((field) => {
      if (typeof data[field] === "string" && data[field].includes(",")) {
        data[field] = data[field].split(",").map((v) => v.trim());
      }
    });

    let images = [];
    if (req.files?.images) {
      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      images = await uploadImagesToCloudinary(files);
    }

    const product = new Product({
      ...data,
      images,
    });

    await product.save();

    res.status(201).json({
      message: "✅ Product created successfully!",
      product,
    });
  } catch (error) {
    console.error("❌ createProduct error:", error.message);
    res.status(500).json({ message: "Server error creating product." });
  }
};

// ✏️ Update Product
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    let updates = { ...req.body };

    // 🧠 Parse JSON strings to proper arrays/objects
    if (typeof updates.attributes === "string") {
      try {
        updates.attributes = JSON.parse(updates.attributes);
      } catch {
        updates.attributes = [];
      }
    }

    if (typeof updates.images === "string") {
      try {
        updates.images = JSON.parse(updates.images);
      } catch {
        updates.images = [];
      }
    }

    ["metaKeywords", "tags", "featuredKeywords"].forEach((field) => {
      if (typeof updates[field] === "string" && updates[field].includes(",")) {
        updates[field] = updates[field]
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
    });

    // 🖼️ Handle new image uploads (up to 3)
    if (req.files?.images) {
      // Remove previous images from Cloudinary
      for (const img of product.images) {
        try {
          await cloudinary.uploader.destroy(img.public_id);
        } catch (err) {
          console.error("⚠️ Failed to delete old Cloudinary image:", err.message);
        }
      }

      const files = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];
      const uploadedImages = [];

      for (let i = 0; i < files.length && i < 3; i++) {
        const result = await cloudinary.uploader.upload(files[i].tempFilePath, {
          folder: "ecommerce/products",
        });
        uploadedImages.push({
          index: i,
          public_id: result.public_id,
          url: result.secure_url,
        });
      }

      updates.images = uploadedImages;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      message: "✅ Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("❌ updateProduct error:", error.message);
    res.status(500).json({ message: "Server error updating product" });
  }
};

// 📦 Get Products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ products });
  } catch (error) {
    console.error("❌ getProducts error:", error.message);
    res.status(500).json({ message: "Server error fetching products." });
  }
};

// 🔍 Get Single Product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ product });
  } catch (error) {
    console.error("❌ getProductById error:", error.message);
    res.status(500).json({ message: "Server error fetching product." });
  }
};

// 🗑️ Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    for (const img of product.images) {
      await cloudinary.uploader.destroy(img.public_id);
    }

    await product.deleteOne();

    res.status(200).json({ message: "🗑️ Product deleted successfully." });
  } catch (error) {
    console.error("❌ deleteProduct error:", error.message);
    res.status(500).json({ message: "Server error deleting product." });
  }
};

// controllers/seoController.js
import Seo from "../models/seoModel.js";

// Public: get SEO by page
export const getSeoByPage = async (req, res) => {
  try {
    const { page } = req.params;
    const seo = await Seo.findOne({ page });
    if (!seo) return res.status(404).json({ message: "SEO not found" });
    res.json(seo);
  } catch (err) {
    console.error("getSeoByPage:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: get all
export const getAllSeos = async (req, res) => {
  try {
    const seos = await Seo.find().sort({ page: 1 });
    res.json(seos);
  } catch (err) {
    console.error("getAllSeos:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: create
export const createSeo = async (req, res) => {
  try {
    const { page, title, description, keywords, image, url, extra } = req.body;
    if (!page) return res.status(400).json({ message: "Page is required" });

    const exists = await Seo.findOne({ page });
    if (exists) return res.status(409).json({ message: "SEO for this page already exists" });

    const seo = new Seo({ page, title, description, keywords, image, url, extra });
    await seo.save();
    res.status(201).json(seo);
  } catch (err) {
    console.error("createSeo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: update
export const updateSeo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const seo = await Seo.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!seo) return res.status(404).json({ message: "SEO not found" });
    res.json(seo);
  } catch (err) {
    console.error("updateSeo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin: delete
export const deleteSeo = async (req, res) => {
  try {
    const { id } = req.params;
    const seo = await Seo.findByIdAndDelete(id);
    if (!seo) return res.status(404).json({ message: "SEO not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteSeo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

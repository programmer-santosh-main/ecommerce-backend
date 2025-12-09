import Site from "../models/siteModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// 🟢 Get current site config
export const getSiteConfig = async (req, res) => {
  try {
    const site = await Site.findOne({ isActive: true });
    if (!site)
      return res.status(404).json({ success: false, message: "No site configuration found." });

    res.status(200).json({ success: true, site });
  } catch (error) {
    console.error("❌ getSiteConfig error:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// 🟡 Create or update site config
export const updateSiteConfig = async (req, res) => {
  try {
    const {
      companyName,
      companyAddress,
      contactEmail,
      contactPhone,
      whatsappNumber,
      socialLinks,
    } = req.body;

    let site = await Site.findOne({ isActive: true });

    // Parse socialLinks JSON string if needed
    let parsedSocials = socialLinks;
    if (typeof socialLinks === "string") {
      try {
        parsedSocials = JSON.parse(socialLinks);
      } catch {
        parsedSocials = {};
      }
    }

    let logoData = site?.logo || null;

    // Handle new logo upload
    if (req.files?.logo) {
      if (logoData?.public_id) {
        try {
          await cloudinary.uploader.destroy(logoData.public_id);
        } catch (err) {
          console.warn("⚠️ Old logo delete failed:", err.message);
        }
      }

      const uploaded = await cloudinary.uploader.upload(req.files.logo.tempFilePath, {
        folder: "ecommerce/site",
      });

      fs.unlinkSync(req.files.logo.tempFilePath);
      logoData = { public_id: uploaded.public_id, url: uploaded.secure_url };
    }

    const data = {
      companyName,
      companyAddress,
      contactEmail,
      contactPhone,
      whatsappNumber,
      socialLinks: parsedSocials,
      logo: logoData,
      updatedBy: req.adminId || null,
      isActive: true,
    };

    if (site) {
      site = await Site.findByIdAndUpdate(site._id, data, { new: true, runValidators: true });
    } else {
      site = await Site.create(data);
    }

    res.status(200).json({
      success: true,
      message: "✅ Site configuration saved successfully!",
      site,
    });
  } catch (error) {
    console.error("❌ updateSiteConfig error:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

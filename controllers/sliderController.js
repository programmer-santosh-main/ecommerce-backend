import Slider from "../models/sliderModel.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// Upload helper (USES CLOUDINARY)
const uploadImageToCloudinary = async (file) => {
  try {
    if (!file || !file.tempFilePath) {
      throw new Error("No valid file received");
    }

    console.log("📤 Uploading to Cloudinary from:", file.tempFilePath);

    // CLOUDINARY UPLOAD
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ecommerce/sliders",
      resource_type: "image",
    });

    // Cleanup temp file
    try {
      fs.unlinkSync(file.tempFilePath);
    } catch (err) {
      console.warn("⚠️ Could not delete temp file:", err.message);
    }

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    // Cleanup on error
    if (file?.tempFilePath && fs.existsSync(file.tempFilePath)) {
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (err) {
        console.warn("⚠️ Cleanup failed:", err.message);
      }
    }
    throw error;
  }
};

// Create slider
export const createSlider = async (req, res) => {
  try {
    const {
      imageTitle,
      imageDescription,
      buttonTitle,
      buttonLink,
      imageIndex,
    } = req.body;

    // Validation
    if (
      !imageTitle ||
      !imageDescription ||
      !buttonTitle ||
      !buttonLink ||
      !imageIndex
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const index = parseInt(imageIndex);
    if (isNaN(index) || index < 1 || index > 5) {
      return res.status(400).json({
        success: false,
        message: "Image Index must be 1-5",
      });
    }

    if (!req.files?.image) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

    // Check index exists
    const existingSlider = await Slider.findOne({ imageIndex: index });
    if (existingSlider) {
      return res.status(400).json({
        success: false,
        message: `Slider with index ${index} exists`,
      });
    }

    // CLOUDINARY UPLOAD
    const uploadedImage = await uploadImageToCloudinary(req.files.image);

    // Create slider
    const slider = new Slider({
      image: uploadedImage,
      imageTitle: imageTitle.trim(),
      imageDescription: imageDescription.trim(),
      buttonTitle: buttonTitle.trim(),
      buttonLink: buttonLink.trim(),
      imageIndex: index,
    });

    await slider.save();

    res.status(201).json({
      success: true,
      message: "✅ Slider created successfully!",
      slider,
    });
  } catch (error) {
    console.error("❌ createSlider error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all sliders
export const getSliders = async (req, res) => {
  try {
    const sliders = await Slider.find().sort({ imageIndex: 1 });
    res.status(200).json({
      success: true,
      count: sliders.length,
      sliders,
    });
  } catch (error) {
    console.error("❌ getSliders error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get single slider
export const getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "❌ Slider not found",
      });
    }
    res.status(200).json({ success: true, slider });
  } catch (error) {
    console.error("❌ getSliderById error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update slider
export const updateSlider = async (req, res) => {
  try {
    const {
      imageTitle,
      imageDescription,
      buttonTitle,
      buttonLink,
      imageIndex,
    } = req.body;
    const slider = await Slider.findById(req.params.id);

    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "❌ Slider not found",
      });
    }

    let updates = {
      imageTitle: imageTitle ? imageTitle.trim() : slider.imageTitle,
      imageDescription: imageDescription
        ? imageDescription.trim()
        : slider.imageDescription,
      buttonTitle: buttonTitle ? buttonTitle.trim() : slider.buttonTitle,
      buttonLink: buttonLink ? buttonLink.trim() : slider.buttonLink,
    };

    // Handle index change
    if (imageIndex) {
      const newIndex = parseInt(imageIndex);
      if (isNaN(newIndex) || newIndex < 1 || newIndex > 5) {
        return res.status(400).json({
          success: false,
          message: "Image Index must be 1-5",
        });
      }
      if (newIndex !== slider.imageIndex) {
        const existingIndex = await Slider.findOne({
          imageIndex: newIndex,
          _id: { $ne: req.params.id },
        });
        if (existingIndex) {
          return res.status(400).json({
            success: false,
            message: `Slider with index ${newIndex} exists`,
          });
        }
      }
      updates.imageIndex = newIndex;
    }

    // Handle new image (CLOUDINARY)
    if (req.files?.image) {
      // Delete old from Cloudinary
      try {
        await cloudinary.uploader.destroy(slider.image.public_id);
      } catch (err) {
        console.warn("⚠️ Old image delete failed:", err.message);
      }

      // Upload new to Cloudinary
      const uploadedImage = await uploadImageToCloudinary(req.files.image);
      updates.image = uploadedImage;
    }

    const updatedSlider = await Slider.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "✅ Slider updated successfully!",
      slider: updatedSlider,
    });
  } catch (error) {
    console.error("❌ updateSlider error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete slider
export const deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "❌ Slider not found",
      });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(slider.image.public_id);
    } catch (err) {
      console.warn("⚠️ Cloudinary delete failed:", err.message);
    }

    await Slider.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "✅ Slider deleted successfully!",
    });
  } catch (error) {
    console.error("❌ deleteSlider error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Toggle status
export const toggleSliderStatus = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    if (!slider) {
      return res.status(404).json({
        success: false,
        message: "❌ Slider not found",
      });
    }

    slider.isActive = !slider.isActive;
    await slider.save();

    res.status(200).json({
      success: true,
      message: `✅ Slider ${slider.isActive ? "activated" : "deactivated"}!`,
      slider,
    });
  } catch (error) {
    console.error("❌ toggleSliderStatus error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

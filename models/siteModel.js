import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    companyAddress: { type: String, required: true, trim: true },
    logo: {
      public_id: { type: String, required: true },
      url: { type: String, required: true }
    },
    contactEmail: { type: String, required: true, match: /^\S+@\S+\.\S+$/ },
    contactPhone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true },
    socialLinks: {
      facebook: String,
      instagram: String,
      tiktok: String,
      twitter: String,
      linkedin: String,
      youtube: String
    },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, collection: 'siteconfig' }
);

siteSchema.index({ isActive: 1 }, { unique: true, partialFilterExpression: { isActive: true } });

export default mongoose.model('Site', siteSchema);

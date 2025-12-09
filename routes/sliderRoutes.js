import express from 'express';
import {
  createSlider,
  getSliders,
  getSliderById,
  updateSlider,
  deleteSlider,
  toggleSliderStatus
} from '../controllers/sliderController.js';
import { adminAuth } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getSliders);
router.get('/:id', getSliderById);

// Admin routes (protected)
router.post('/', adminAuth, createSlider);
router.put('/:id', adminAuth, updateSlider);
router.delete('/:id', adminAuth, deleteSlider);
router.patch('/:id/toggle-status', adminAuth, toggleSliderStatus);

export default router;
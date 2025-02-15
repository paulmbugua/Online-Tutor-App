import express from 'express';
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';

import {
  createProfile,
  updateProfile,
  getUserProfile,
  toggleNotifications,
  addRecentChat,
  updateRating,
  getProfile,
  getProfileById,
  removeProfileItem,
  uploadSingleFile,
  getProfileWithRecommendations,
  getProfileByUserId,
  getRandomProfile,
} from '../controllers/profileController.js';

const router = express.Router();

// Route to get a random profile - Place this before `/:id` to avoid conflict
router.get('/random', getRandomProfile);

// Route to create a profile
router.post(
  '/',
  authUser,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  createProfile
);

// Route to update a profile by ID
router.put(
  '/:id',
  authUser,
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  updateProfile
);

// Route to get the authenticated user's profile
router.get('/me', authUser, getUserProfile);

// Route to delete a specific item in profile fields
router.delete('/:id/remove/:field', authUser, removeProfileItem);

// Route to toggle notifications for the authenticated user
router.patch('/notifications', authUser, toggleNotifications);

// Route to add recent chat interaction
router.patch('/:id/recent-chat', authUser, addRecentChat);

// Route to update profile rating
router.patch('/:id/rate', authUser, updateRating);

// Route to upload a single file (image or video)
router.post('/upload/:type', authUser, upload.single('file'), uploadSingleFile);

// Route to get top profiles (filtered or default top profiles)
router.get('/', getProfile);

// Route to get a specific profile by ID
router.get('/:id', getProfileById);

// Route to get a specific profile by user ID
router.get('/user/:userId', getProfileByUserId);

// Route to get a profile with recommendations
router.get('/:id/recommendations', getProfileWithRecommendations);

export default router;

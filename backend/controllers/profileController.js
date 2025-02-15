// Imports and utilities
import { v2 as cloudinary } from 'cloudinary';
import { Profile } from '../models/Profile.js';
import { profileValidationSchema, profileUpdateValidationSchema } from '../validators/profileValidators.js';

// Utility function to upload files to Cloudinary
const uploadToCloudinary = async (files, resourceType = 'image') => {
  try {
    const uploadPromises = files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, { 
        resource_type: resourceType,
        public_id: `profiles/${file.filename}`
      });
      return { url: result.secure_url, public_id: result.public_id };
    });
    return Promise.all(uploadPromises);
  } catch (error) {
    throw new Error('File upload failed');
  }
};

// Utility function to delete files from Cloudinary
const deleteFromCloudinary = async (publicIds) => {
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error('Cloudinary Delete Error:', error.message);
  }
};

// 1. Create Profile
export const createProfile = async (req, res) => {
  try {
    const { role, name, age, paymentMethod, bankAccount, bankCode, mpesaPhoneNumber } = req.body;

    // Trim category and handle optional
    const category = req.body.category?.trim() || undefined;

    // Handle file uploads
    const images = ['image1', 'image2', 'image3', 'image4']
      .map((key) => req.files?.[key]?.[0])
      .filter(Boolean);

    const gallery = role === 'tutor' ? await uploadToCloudinary(images, 'image') : [];
    const videoUrl =
      role === 'tutor' && req.files?.video?.[0]
        ? (await uploadToCloudinary([req.files.video[0]], 'video'))[0].url
        : '';

    // Prepare description and pricing for tutors
    const description =
      role === 'tutor'
        ? {
            bio: req.body['description.bio'],
            expertise: JSON.parse(req.body['description.expertise'] || '[]'),
            teachingStyle: JSON.parse(req.body['description.teachingStyle'] || '[]'),
          }
        : undefined;

    const pricing = role === 'tutor' ? JSON.parse(req.body.pricing || '{}') : undefined;
    const languages = JSON.parse(req.body.languages || '[]');
    const ageGroup = role === 'student' ? JSON.parse(req.body.ageGroup || '[]') : undefined;

    // Prepare payment details (only for tutors)
    const paymentDetails =
      role === 'tutor'
        ? {
            paymentMethod,
            ...(paymentMethod === 'bank' && { bankAccount, bankCode }),
            ...(paymentMethod === 'mpesa' && { mpesaPhoneNumber }),
          }
        : undefined;

    // Validate data
    const { error } = profileValidationSchema.validate({
      role,
      name,
      age: parseInt(age, 10),
      category,
      description,
      pricing,
      languages,
      ageGroup,
      ...(role === 'tutor' && { gallery: gallery.map(({ url }) => url) }),
      ...(role === 'tutor' && { paymentMethod, bankAccount, bankCode, mpesaPhoneNumber }),
    });

    if (error) {
      console.error('Validation Error:', error.details);
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    // Create the profile
    const profileData = {
      user: req.user.id,
      role,
      name,
      age: parseInt(age, 10),
      ...(category && { category }),
      ...(role === 'tutor' && { description, pricing}),
      languages,
      ...(role === 'tutor' && { gallery: gallery.map(({ url }) => url) }),
      ...(role === 'tutor' && { video: videoUrl }),
      ...(role === 'student' && { ageGroup }),
      ...(role === 'tutor' && paymentDetails),
    };

    const profile = new Profile(profileData);
    await profile.save();

    res.status(201).json({ success: true, profile });
  } catch (error) {
    console.error('Error in createProfile:', error.message);
    res.status(500).json({ message: 'Failed to create profile.', error: error.message });
  }
};


export const updateProfile = async (req, res) => {
  console.log('Received data on backend:', req.body);
  try {
    // Destructure fields from req.body.
    // Note: We expect some fields to be JSON-stringified.
    const {
      name,
      age: ageStr,
      status,
      category,
      pricing,
      languages,
      experienceLevel,
      recommended,
      ageGroup, // JSON-stringified array from the client (for both roles)
      paymentMethod,
      bankAccount,
      bankCode,
      mpesaPhoneNumber,
    } = req.body;

    // Find the profile for the authenticated user.
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    // Parse and convert fields as needed.
    const age = parseInt(ageStr, 10);
    const parsedLanguages = languages ? JSON.parse(languages) : [];
    // Now, allow ageGroup for both student and tutor.
    const parsedAgeGroup = ageGroup ? JSON.parse(ageGroup) : undefined;
    const parsedPricing = (profile.role === 'tutor' && pricing) ? JSON.parse(pricing) : undefined;
    const parsedRecommended = (profile.role === 'tutor' && recommended) ? JSON.parse(recommended) : [];

    // Build the description for tutors.
    const description = profile.role === 'tutor' ? {
      bio: req.body['description.bio'] || (profile.description && profile.description.bio),
      expertise: req.body['description.expertise']
        ? JSON.parse(req.body['description.expertise'])
        : (profile.description ? profile.description.expertise : []),
      teachingStyle: req.body['description.teachingStyle']
        ? JSON.parse(req.body['description.teachingStyle'])
        : (profile.description ? profile.description.teachingStyle : []),
    } : undefined;

    // Build the validation object using the profile's stored role.
    const validationData = {
      role: profile.role, // Use the role stored in the profile
      name,
      age,
      languages: parsedLanguages,
      // Now include ageGroup for both students and tutors.
      ageGroup: parsedAgeGroup,
      // Tutor-specific fields:
      category: profile.role === 'tutor' ? category : undefined,
      pricing: profile.role === 'tutor' ? parsedPricing : undefined,
      recommended: profile.role === 'tutor' ? parsedRecommended : undefined,
      experienceLevel: profile.role === 'tutor' ? experienceLevel : undefined,
      description: profile.role === 'tutor' ? description : undefined,
      paymentMethod: profile.role === 'tutor' ? paymentMethod : undefined,
      bankAccount: profile.role === 'tutor' ? bankAccount : undefined,
      bankCode: profile.role === 'tutor' ? bankCode : undefined,
      mpesaPhoneNumber: profile.role === 'tutor' ? mpesaPhoneNumber : undefined,
      status: profile.role === 'tutor' ? status : undefined,
    };

    // Validate the incoming data using Joi, stripping unknown fields.
    const { error, value } = profileUpdateValidationSchema.validate(validationData, { stripUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: 'Validation error', error: error.details });
    }

    // Update common fields.
    profile.name = value.name || profile.name;
    profile.age = value.age || profile.age;
    profile.languages = value.languages.length ? value.languages : profile.languages;
    profile.ageGroup = value.ageGroup || profile.ageGroup; // Now applies to both roles

    if (profile.role === 'student') {
      // For students, ageGroup is already updated above.
    } else if (profile.role === 'tutor') {
      // For tutors, update the extended fields.
      profile.category = value.category || profile.category;
      profile.description = value.description;
      profile.pricing = value.pricing || profile.pricing;
      profile.experienceLevel = value.experienceLevel || profile.experienceLevel;
      profile.status = value.status || profile.status;
      profile.recommended = value.recommended || profile.recommended;
      
      if (value.paymentMethod) {
        profile.paymentMethod = value.paymentMethod;
        if (value.paymentMethod === 'bank') {
          if (value.bankAccount) profile.bankAccount = value.bankAccount;
          if (value.bankCode) profile.bankCode = value.bankCode;
        }
        if (value.paymentMethod === 'mpesa' && value.mpesaPhoneNumber) {
          profile.mpesaPhoneNumber = value.mpesaPhoneNumber;
        }
      }
      // For tutors, ageGroup is now updated above as well.
    }

    // Handle file uploads.
    const fileKeys = ['image1', 'image2', 'image3', 'image4'];
    const images = fileKeys
      .map((key) => req.files?.[key]?.[0])
      .filter(Boolean);
    if (images.length) {
      const uploadedImages = await uploadToCloudinary(images, 'image');
      profile.gallery = uploadedImages.map(({ url }) => url);
    }
    if (profile.role === 'tutor' && req.files?.video?.[0]) {
      const videoUpload = await uploadToCloudinary([req.files.video[0]], 'video');
      profile.video = videoUpload[0]?.url || profile.video;
    }

    console.log('Saving updated profile:', profile);
    const updatedProfile = await profile.save();
    console.log('Profile after save:', updatedProfile);
    res.status(200).json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Error in updateProfile:', error.message);
    res.status(500).json({ message: 'Failed to update profile.', error: error.message });
  }
};


// 3. Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(200).json({ profileExists: false, profile: { gallery: [] } });
    }

    // Ensure gallery is always an array
    const safeProfile = {
      ...profile.toObject(),
      gallery: Array.isArray(profile.gallery) ? profile.gallery : [],
    };

    res.status(200).json({ profileExists: true, profile: safeProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile.' });
  }
};


// 4. Toggle Notifications
export const toggleNotifications = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    profile.notifications = !profile.notifications;
    await profile.save();
    res.json({ success: true, message: 'Notifications toggled successfully', profile });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle notifications.' });
  }
};

// 5. Add Recent Chat Interaction
export const addRecentChat = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    profile.recentChatsCount += 1;
    await profile.save();
    res.status(200).json({ success: true, message: 'Added to recent chats', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update recent chats' });
  }
};

// 6. Update Profile Rating
export const updateRating = async (req, res) => {
  try {
    const { rating } = req.body;
    const profile = await Profile.findById(req.params.id);
    profile.rating.total += rating;
    profile.rating.count += 1;
    await profile.save();
    res.status(200).json({ success: true, message: 'Rating updated', profile });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update rating' });
  }
};

// 7. Get Profile (with filters)
export const getProfile = async (req, res) => {
  const { status,experienceLevel, expertise, teachingStyle, ageGroup, languageFluency, pricing, category, attribute } = req.query;

  let filter = {};
  if (experienceLevel) filter.experienceLevel = experienceLevel;
  
   // Filter by teaching style (supports multiple values with comma-separated strings)
  if (teachingStyle) filter['description.teachingStyle'] = { $in: teachingStyle.split(',') };

  // Filter by expertise
  if (expertise) filter['description.expertise'] = { $in: expertise.split(',') };

  // Filter by age group (matches if any value in the array matches)
  if (ageGroup) filter.ageGroup = { $in: ageGroup.split(',') };

  // Filter by language fluency
  if (languageFluency) filter.languageFluency = languageFluency;

  // Filter by pricing range (handles nested fields for different session types)
  if (pricing) {
    const [min, max] = pricing.split('-').map(Number);
    filter.$or = [
      { 'pricing.privateSession': { $gte: min, $lte: max } },
      { 'pricing.groupSession': { $gte: min, $lte: max } },
      { 'pricing.lecture': { $gte: min, $lte: max } },
      { 'pricing.workshop': { $gte: min, $lte: max } },
    ];
  }

  // Filter by category
  if (category) filter.category = category;

  // Filter by additional attributes if provided
  if (attribute) filter.attributes = attribute;
  if (status) filter.status = status;

  try {
    const profiles = Object.keys(filter).length > 0
      ? await Profile.find(filter)
      : await Profile.find()
          .sort({ favoritesCount: -1, recentChatsCount: -1, 'rating.total': -1 })
          .limit(20);

    res.status(200).json({ success: true, profiles });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profiles' });
  }
};
// 8. Get Profile by ID
export const getProfileById = async (req, res) => {
  const { id } = req.params;

  try {
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// 9. Remove Profile Item
export const removeProfileItem = async (req, res) => {
  const { id, field } = req.params;
  const { item } = req.body;

  try {
    const profile = await Profile.findById(id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    if (field === 'gallery') {
      const publicIdToRemove = item.split('/').pop().split('.')[0];
      await deleteFromCloudinary([publicIdToRemove]);
      profile.gallery = profile.gallery.filter((url) => url !== item);
    } else if (field === 'video') {
      const publicIdToRemove = profile.video.split('/').pop().split('.')[0];
      await deleteFromCloudinary([publicIdToRemove]);
      profile.video = '';
    } else {
      await Profile.findByIdAndUpdate(id, { $pull: { [field]: item } });
    }

    await profile.save();
    res.status(200).json({ message: `${field} item removed successfully`, profile });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// 10. Upload Single File
export const uploadSingleFile = async (req, res) => {
  const { type } = req.params;
  if (!['image', 'video'].includes(type)) return res.status(400).json({ message: 'Invalid file type' });

  try {
    const resourceType = type === 'video' ? 'video' : 'image';
    const result = await cloudinary.uploader.upload(req.file.path, { resource_type: resourceType, folder: 'profiles' });
    res.status(200).json({ url: result.secure_url });
  } catch (error) {
    res.status(500).json({ message: 'File upload failed' });
  }
};

// 11. Get Profile with Recommendations
export const getProfileWithRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id).populate('recommended', 'name status gallery');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// 12. Get Profile by User ID
export const getProfileByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile by user ID.' });
  }
};

// 13. Get Random Profile
export const getRandomProfile = async (req, res) => {
  try {
    // Count only profiles with role 'tutor'
    const count = await Profile.countDocuments({ role: 'tutor' });
    console.log('Total tutor profiles in database:', count);

    if (count === 0) {
      console.log('No tutor profiles found.');
      return res.status(404).json({ message: 'No tutor profiles found' });
    }

    // Generate a random index within the count
    const random = Math.floor(Math.random() * count);
    console.log('Random index generated:', random);

    // Find a random profile with role 'tutor'
    const randomProfile = await Profile.findOne({ role: 'tutor' })
      .skip(random)
      .select('name role gallery category description.expertise description.teachingStyle rating');
    console.log('Fetched random profile:', randomProfile);

    if (!randomProfile) {
      console.log('No profile found after random selection.');
      return res.status(404).json({ message: 'No profiles found' });
    }

    res.json({
      name: randomProfile.name,
      role: randomProfile.role, // Ensure role is included
      gallery: randomProfile.gallery,
      category: randomProfile.category,
      expertise: randomProfile.description?.expertise || [],
      teachingStyle: randomProfile.description?.teachingStyle || [],
      rating: randomProfile.rating,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};


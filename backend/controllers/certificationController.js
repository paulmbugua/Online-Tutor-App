// controllers/certificationController.js
import { v2 as cloudinary } from 'cloudinary';
import { Certification, Profile } from '../models/Profile.js';

// Tutor submits certification documents
export const submitCertification = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Check if a certification already exists for this profile
    const existingCert = await Certification.findOne({ profileId });
    if (existingCert && (existingCert.status === 'Pending' || existingCert.status === 'Verified')) {
      return res.status(400).json({ message: 'Certification already submitted and is pending verification.' });
    }

    // Ensure files were uploaded (req.files is an array)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No certification documents uploaded.' });
    }

    // Upload each file to Cloudinary (resource_type 'auto' covers images, PDFs, etc.)
    const uploadPromises = req.files.map(file =>
      cloudinary.uploader.upload(file.path, {
        resource_type: 'auto',
        public_id: `certifications/${file.filename}`,
      })
    );
    const results = await Promise.all(uploadPromises);

    // Map results to an array of document objects
    const documents = results.map(result => ({
      fileUrl: result.secure_url,
      public_id: result.public_id,
    }));

    // Retrieve tutor details from the Profile collection to save the tutor's name
    const tutor = await Profile.findById(profileId);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor profile not found.' });
    }

    // Create a new Certification document with tutorName and status 'Pending'
    const certificationData = {
      profileId,
      tutorName: tutor.name, // Saving tutor's name for identification
      documents,           // Array of uploaded document details
      status: 'Pending',
      submittedAt: new Date(),
    };

    const certification = new Certification(certificationData);
    await certification.save();

    // Optionally update the Profile document to mark certification as pending
    await Profile.findByIdAndUpdate(profileId, { certified: false });

    res.status(200).json({
      message: 'Certification submitted successfully and is pending verification.',
      certification,
    });
  } catch (error) {
    console.error('Error submitting certification:', error.message);
    res.status(500).json({ message: 'Error submitting certification.', error: error.message });
  }
};

// Admin verifies a tutor's certification document
export const verifyCertification = async (req, res) => {
  try {
    const { profileId } = req.params;

    // Find the Certification document by profileId and update its status to 'Verified'
    const certification = await Certification.findOneAndUpdate(
      { profileId },
      { status: 'Verified', verifiedAt: new Date() },
      { new: true }
    );

    if (!certification) {
      return res.status(404).json({ message: 'Certification not found for this profile.' });
    }

    // Optionally update the related Profile to indicate that the tutor is certified
    await Profile.findByIdAndUpdate(profileId, { certified: true });

    res.status(200).json({
      message: 'Certification verified successfully.',
      certification,
    });
  } catch (error) {
    console.error('Error verifying certification:', error.message);
    res.status(500).json({ message: 'Error verifying certification.', error: error.message });
  }
};

// Get certification status for a tutor
export const getCertificationStatus = async (req, res) => {
  try {
    const { profileId } = req.params;
    const certification = await Certification.findOne({ profileId });
    if (!certification) {
      return res.status(404).json({ message: 'Certification not found for this profile.' });
    }
    res.status(200).json({ certification });
  } catch (error) {
    console.error('Error fetching certification status:', error.message);
    res.status(500).json({ message: 'Error fetching certification status.', error: error.message });
  }
};

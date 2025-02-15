// components/CertificationSettings.jsx
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const MAX_FILE_SIZE = 5242880; // 5MB in bytes
const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

const CertificationSettings = () => {
  const { token, backendUrl, profile } = useContext(ShopContext);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [certificationData, setCertificationData] = useState(null);

  // Only tutors are allowed to upload
  if (!profile || !profile.role || profile.role.toLowerCase() !== 'tutor') {
    return (
      <div className="w-full max-w-3xl mx-auto bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-pink-400 mb-4">Tutor Certification</h2>
        <p className="text-gray-400 text-sm">
          Certification upload is available only for tutors.
        </p>
      </div>
    );
  }

  // Fetch certification status on mount
  useEffect(() => {
    const fetchCertificationStatus = async () => {
      if (!profile || !profile._id) return;
      try {
        const response = await axios.get(
          `${backendUrl}/api/profiles/${profile._id}/certification/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.certification) {
          setCertificationData(response.data.certification);
        }
      } catch (error) {
        console.error("Error fetching certification status:", error.response?.data || error.message);
      }
    };
    fetchCertificationStatus();
  }, [profile, backendUrl, token]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Validate each file's size and type
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" has an invalid file format.`);
        return false;
      }
      return true;
    });
    setFiles(validFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) {
      toast.error("Please select at least one file to upload.");
      return;
    }
    if (!profile._id) {
      toast.error("Profile not loaded properly. Please try again later.");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('certification', file);
    });

    try {
      const response = await axios.post(
        `${backendUrl}/api/profiles/${profile._id}/certification`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setCertificationData(response.data.certification);
      // Show appropriate success message based on whether it's a new submission or an update
      if (certificationData) {
        toast.success("Certification updated successfully and is still pending verification.");
      } else {
        toast.success("Certification submitted successfully and is pending verification.");
      }
    } catch (error) {
      console.error("Error uploading certification:", error.response?.data || error.message);
      toast.error("Failed to upload certification documents.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-gray-900 p-6 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold text-pink-400 mb-4">Tutor Certification</h2>
      <p className="text-gray-400 mb-6 text-sm">
        (Optional) Enhance your profile's credibility by submitting your qualification documents.
        You can upload multiple files (each max 5MB, PDF/JPEG/PNG). You may submit these anytime after profile creation.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="certificationFiles" className="block text-gray-300 mb-2">
            Certification Documents
          </label>
          <input 
            type="file" 
            id="certificationFiles" 
            name="certification" 
            multiple 
            accept=".pdf,image/*" 
            onChange={handleFileChange} 
            className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <p className="text-gray-500 text-xs mt-1">
            Allowed formats: PDF, JPEG, PNG. Maximum file size per file: 5MB.
          </p>
        </div>
        {(!certificationData || certificationData.status === 'Pending') ? (
          <button 
            type="submit" 
            disabled={uploading}
            className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md shadow transition duration-300"
          >
            {uploading
              ? "Uploading..."
              : (certificationData ? "Update Certification" : "Submit Certification")}
          </button>
        ) : (
          <div className="mt-6 p-4 bg-green-600 rounded-md">
            <p className="text-white text-sm">
              Certification status: <span className="font-bold">{certificationData.status}</span>
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default CertificationSettings;

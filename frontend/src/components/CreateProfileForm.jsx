import React, { useState, useEffect, useContext } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaVideo, FaTrashAlt } from 'react-icons/fa';
import { ShopContext } from '../context/ShopContext';

const CreateProfileForm = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();
  const { refreshProfile } = useContext(ShopContext);

  // The role is auto-fetched from the backend.
  const [role, setRole] = useState('');
  const [token, setToken] = useState('');

  // Common fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  // For language selection (for both student and tutor)
  const [languages, setLanguages] = useState({
    English: false,
    Swahili: false,
    French: false,
    Spanish: false,
    German: false,
  });
  
  // Student-specific field
  const [ageGroup, setAgeGroup] = useState([]); 

  // Tutor-specific fields
  const [category, setCategory] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState([]);
  const [teachingStyle, setTeachingStyle] = useState([]);
  const [pricing, setPricing] = useState({
    privateSession: '',
    groupSession: '',
    lecture: '',
    workshop: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [mpesaPhoneNumber, setMpesaPhoneNumber] = useState('');
  const [images, setImages] = useState([null, null, null, null]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [loading, setLoading] = useState(false);

  // Fetch token from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  // Once token is available, fetch user's role
  useEffect(() => {
    if (token) {
      axios
        .get(`${backendUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data.success) {
            setRole(response.data.role);
          } else {
            toast.error("Failed to fetch user role");
          }
        })
        .catch((error) => {
          toast.error("Error fetching user role");
        });
    }
  }, [token, backendUrl]);

  // --- Handlers for fields ---

  const handleLanguageSelect = (language) => {
    setLanguages((prev) => ({ ...prev, [language]: !prev[language] }));
  };

  const handleAgeGroupChange = (e) => {
    const { value } = e.target;
    setAgeGroup((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  // Tutor-only handlers for media uploads
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const handlePricingChange = (e, field) => {
    const { value } = e.target;
    setPricing((prev) => ({
      ...prev,
      [field]: value || '',
    }));
  };

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert selected languages (object keys where value is true) into an array.
      const selectedLanguages = Object.keys(languages).filter(
        (lang) => languages[lang]
      );
      const formData = new FormData();

      // Append common fields for both roles
      formData.append("role", role);
      formData.append("name", name.trim());
      formData.append("age", age);
      formData.append("languages", JSON.stringify(selectedLanguages));

      if (role === "student") {
        // For students, only append ageGroup
        formData.append("ageGroup", JSON.stringify(ageGroup));
      } else if (role === "tutor") {
        // Tutor-specific fields
        formData.append("category", category || "");
        formData.append("description.bio", bio);
        formData.append("description.expertise", JSON.stringify(expertise));
        formData.append("description.teachingStyle", JSON.stringify(teachingStyle));
        formData.append("pricing", JSON.stringify(pricing));

        if (!paymentMethod) {
          toast.error("Please select a payment method.");
          setLoading(false);
          return;
        }
        formData.append("paymentMethod", paymentMethod);

        if (paymentMethod === "bank") {
          if (!bankAccount || !bankCode) {
            toast.error("Please provide both Bank Account Number and Bank Code.");
            setLoading(false);
            return;
          }
          formData.append("bankAccount", bankAccount);
          formData.append("bankCode", bankCode);
        }

        if (paymentMethod === "mpesa") {
          if (!mpesaPhoneNumber) {
            toast.error("Please provide your M-Pesa phone number.");
            setLoading(false);
            return;
          }
          let formattedPhoneNumber = mpesaPhoneNumber.trim();
          if (formattedPhoneNumber.startsWith("0")) {
            formattedPhoneNumber = `+254${formattedPhoneNumber.slice(1)}`;
          }
          formData.append("mpesaPhoneNumber", formattedPhoneNumber);
        }

        // Append images for gallery (required for tutors)
        const validImages = images.filter(Boolean);
        if (validImages.length === 0) {
          throw new Error("Gallery must contain at least one image for tutors.");
        }
        validImages.forEach((image, index) => {
          formData.append(`image${index + 1}`, image);
        });

        if (video) {
          formData.append("video", video);
        }
      }

      console.log("Filtered FormData being sent:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await axios.post(`${backendUrl}/api/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 201) {
        toast.success("Profile created successfully!");
        refreshProfile();
        navigate("/"); // Navigate to home page after successful creation
      } else {
        toast.error("Failed to create profile.");
      }
    } catch (error) {
      console.error("Error creating profile:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "An error occurred while creating the profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 sm:p-6 bg-gray-900 rounded-lg shadow-lg max-w-lg mx-auto text-white relative"
    >
      <h2 className="text-2xl font-bold text-pink-400 text-center">Create Your Profile</h2>

      {/* Display fetched role */}
      {role ? (
        <div className="space-y-2">
          <label className="text-base sm:text-lg text-gray-400">Your Role</label>
          <p className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg">{role}</p>
        </div>
      ) : (
        <p className="text-gray-400">Fetching your role...</p>
      )}

      {/* Common Fields for Both Roles */}
      <input
        type="text"
        placeholder="Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
        required
      />
      <input
        type="number"
        placeholder={`Age (${role === 'tutor' ? '18+' : '5+'})`}
        value={age}
        onChange={(e) => setAge(e.target.value)}
        className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
        min={role === 'tutor' ? 18 : 5}
        required
      />

      {/* Language Selection (applies for both roles) */}
      <div className="space-y-2 mt-4">
        <label className="text-base sm:text-lg text-gray-400">Select Languages You Speak</label>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(languages).map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => handleLanguageSelect(language)}
              className={`p-2 rounded border ${
                languages[language] ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-400'
              } text-base sm:text-lg`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      {/* Student-Specific Fields */}
      {role === "student" && (
        <>
          <h3 className="text-base sm:text-lg font-semibold text-gray-400 mt-4">Age Group</h3>
          <div className="flex flex-wrap gap-3">
            {['Pre-Primary', 'Lower Primary', 'Upper Primary', 'University/College', 'Adults'].map((group) => (
              <button
                key={group}
                type="button"
                className={`p-2 rounded-lg ${
                  ageGroup.includes(group) ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-300'
                } text-base sm:text-lg`}
                onClick={() => handleAgeGroupChange({ target: { value: group } })}
              >
                {group}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Extended Fields for Tutors */}
      {role === "tutor" && (
        <>
          <div className="space-y-2">
            <label className="text-base sm:text-lg text-gray-400">Select Subject or Skill Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
              required
            >
              <option value="" disabled>Select a category</option>
              <option value="Math Tutor">Math Tutor</option>
              <option value="Sciences">Sciences</option>
              <option value="Programming">Programming</option>
              <option value="Art & Design">Art & Design</option>
              <option value="Languages">Languages</option>
              <option value="Wellness">Wellness</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-base sm:text-lg text-gray-400">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
              required
            >
              <option value="" disabled>Select payment method</option>
              <option value="bank">Bank</option>
              <option value="mpesa">M-Pesa</option>
            </select>
          </div>

          {paymentMethod === 'bank' && (
            <div className="space-y-2">
              <label className="text-base sm:text-lg text-gray-400">Bank Account Details</label>
              <input
                type="text"
                placeholder="Enter your Bank Account Number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
                required
              />
            </div>
          )}

          {paymentMethod === 'bank' && (
            <div className="space-y-2">
              <label className="text-base sm:text-lg text-gray-400">Bank Code</label>
              <input
                type="text"
                placeholder="Enter your Bank Code"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
                required
              />
            </div>
          )}

          {paymentMethod === 'mpesa' && (
            <div className="space-y-2">
              <label className="text-base sm:text-lg text-gray-400">M-Pesa Phone Number</label>
              <input
                type="text"
                placeholder="+2547XXXXXXXX"
                value={mpesaPhoneNumber}
                onChange={(e) => setMpesaPhoneNumber(e.target.value)}
                className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
                required
              />
            </div>
          )}

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-2">Teaching Styles</h3>
            <div className="flex flex-wrap gap-3">
              {['One-on-One', 'Group', 'Workshop', 'Lecture'].map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`p-2 rounded-lg ${
                    teachingStyle.includes(style) ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-300'
                  } text-base sm:text-lg`}
                  onClick={() => {
                    setTeachingStyle((prev) =>
                      prev.includes(style)
                        ? prev.filter((item) => item !== style)
                        : [...prev, style]
                    );
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <textarea
            placeholder="A short bio about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 text-white text-base sm:text-lg"
            rows={3}
          ></textarea>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-400 mb-2">Expertise</h3>
            <div className="flex flex-wrap gap-3">
              {['Exam Prep', 'Skill Building', 'Homework Help', 'Career Guidance'].map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`p-2 rounded-lg ${
                    expertise.includes(skill) ? 'bg-pink-500 text-white' : 'bg-gray-800 text-gray-300'
                  } text-base sm:text-lg`}
                  onClick={() => {
                    setExpertise((prev) =>
                      prev.includes(skill)
                        ? prev.filter((item) => item !== skill)
                        : [...prev, skill]
                    );
                  }}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-base sm:text-lg text-gray-400">Set Your Rates (Tokens per Session @10Shs/Token)</label>
            <div className="grid gap-4 sm:grid-cols-2">
              {['privateSession', 'groupSession', 'workshop', 'lecture'].map((field) => {
                const tokenRanges = {
                  privateSession: { min: 20, max: 150 },
                  groupSession: { min: 15, max: 80 },
                  workshop: { min: 15, max: 200 },
                  lecture: { min: 10, max: 50 },
                };
                const { min = 0, max = 100 } = tokenRanges[field] || {};
                return (
                  <div key={field} className="flex flex-col">
                    <label className="text-sm sm:text-base text-gray-300">
                      {field.replace(/([A-Z])/g, ' $1')} (Min: {min} | Max: {max})
                    </label>
                    <input
                      type="number"
                      placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1')} Tokens`}
                      value={pricing[field]}
                      onChange={(e) => handlePricingChange(e, field)}
                      className="p-2 sm:p-3 rounded-lg bg-gray-800 text-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm sm:text-base"
                      min={min}
                      max={max}
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-base sm:text-lg text-gray-400">Upload Profile Images</label>
            <div className="flex flex-wrap gap-2">
              {images.map((image, index) => (
                <label key={index} htmlFor={`image${index + 1}`} className="w-20 h-20 sm:w-24 sm:h-24 border flex items-center justify-center cursor-pointer">
                  <img
                    src={image ? URL.createObjectURL(image) : '/upload_placeholder.png'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <input
                    type="file"
                    id={`image${index + 1}`}
                    hidden
                    onChange={(e) => {
                      const newImages = [...images];
                      newImages[index] = e.target.files[0];
                      setImages(newImages);
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-base sm:text-lg text-gray-400">Introduction Video</label>
            <div className="flex items-center justify-center sm:justify-start gap-4">
              {videoPreview ? (
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gray-800 rounded-lg overflow-hidden">
                  <video src={videoPreview} className="w-full h-full object-cover" controls={false} />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    title="Remove video"
                  >
                    <FaTrashAlt size={14} />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="video-upload"
                  className="flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                  title="Upload video"
                >
                  <FaVideo className="text-gray-400" size={24} />
                </label>
              )}
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
              />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg text-base sm:text-lg"
        disabled={loading}
      >
        {loading ? 'Creating Profile...' : 'Create Profile'}
      </button>
    </form>
  );
};

export default CreateProfileForm;

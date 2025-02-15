import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHeart, faGift } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const ProfileActions = ({ profileId, isOnline, }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const navigate = useNavigate();

  // Handle Send Message action
  const handleSendMessage = () => {
    if (isOnline) {
      navigate(`/chat/${profileId}`);
    } else {
      toast.info('This model is currently offline.');
    }
  };

  // Handle Add to Favorites action
  const handleAddToFavorites = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/profileActions/favorites`,
        { profileId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Added to favorites');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to favorites');
    }
  };

  // Handle Send Gift action
  const handleSendGift = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/profileActions/gifts`,
        { profileId, giftType: 'default' }, // Modify as needed for different gift types
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Gift sent successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send gift');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSendMessage}
        className="flex items-center justify-center w-full bg-pink-600 py-2 rounded-lg shadow-lg hover:bg-pink-700 transition"
      >
        <FontAwesomeIcon icon={faEnvelope} className="mr-2" /> Send Message
      </button>
      <button
        onClick={handleAddToFavorites}
        className="flex items-center justify-center w-full bg-gray-600 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition"
      >
        <FontAwesomeIcon icon={faHeart} className="mr-2" /> Add to Favorites
      </button>
      <button
        onClick={handleSendGift}
        className="flex items-center justify-center w-full bg-gray-600 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition"
      >
        <FontAwesomeIcon icon={faGift} className="mr-2" /> Send Gift
      </button>
    </div>
  );
};

export default ProfileActions;

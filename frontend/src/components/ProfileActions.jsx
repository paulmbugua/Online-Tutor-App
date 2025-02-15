import React, { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faHeart, faGift } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const ProfileActions = ({ recipientId, onSendMessage }) => {
  const { backendUrl, token } = useContext(ShopContext);

  const handleAddToFavorites = async () => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/profileActions/favorites`,
        { profileId: recipientId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(response.data.message || 'Added to favorites');
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      toast.error(error.response?.data?.message || 'Failed to add to favorites');
    }
  };

  
  return (
    <div className="space-y-2">
      <button
        onClick={() => onSendMessage(recipientId)}
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
      </div>
  );
};
export default ProfileActions;

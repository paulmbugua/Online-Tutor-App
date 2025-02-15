import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProfileActions from '../components/ProfileActions';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSmile } from '@fortawesome/free-solid-svg-icons';
import TutorReviews from '../components/TutorReviews'; // Import the reviews component
import Spinner from '../components/Spinner'; 

const ProfileDetailPage = () => {
  const { id } = useParams();
  const { sendMessage, backendUrl, token, chats, userId } = useContext(ShopContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/profile/${id}`);
        if (response.data) {
          setProfile(response.data);
        } else {
          toast.error('Failed to load profile.');
        }
      } catch (error) {
        toast.error('An error occurred while fetching profile.');
      }
    };
    fetchProfile();
  }, [backendUrl, id]);

  const toggleChat = () => {
    setShowChat((prev) => !prev);
  };

  const handleCreateSession = () => {
    if (!profile.user) {
      console.error('Tutor ID (profile.user) is missing');
      return;
    }
    if (!profile.pricing) {
      console.error('Pricing information is missing');
      return;
    }
    const pricingParam = encodeURIComponent(JSON.stringify(profile.pricing));
    navigate(
      `/account?action=createSession&tutorId=${encodeURIComponent(
        profile.user
      )}&subject=${encodeURIComponent(profile.category)}&pricing=${pricingParam}`
    );
  };

  const handleSendMessage = async () => {
    if (!token) {
      toast.error('You need to be logged in to send messages.');
      return;
    }
    if (newMessage.trim()) {
      await sendMessage({
        recipientId: profile.user,
        content: newMessage,
        unread: userId !== profile.user,
      });
      setNewMessage('');
      setShowChat(false);
    } else {
      toast.error("Message content can't be empty.");
    }
  };

  const chatMessages = chats.find((chat) => chat.recipientId === id)?.messages || [];

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }
  

  const statusColor =
  profile.status === 'Online'
    ? 'bg-green-500'
    : profile.status === 'Busy'
    ? 'bg-yellow-500'
    : profile.status === 'Free'
    ? 'bg-purple-500'
    : 'bg-gray-500';
;

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar />
      </div>

      {/* Top Section: Profile Image/Video & Info */}
      <div className="pt-24 p-4 max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left: Profile Image & Video */}
        <div className="lg:w-1/2 flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-lg shadow-xl">
            <img
              src={profile.gallery?.[0] || '/default-image.jpg'}
              alt={profile.name}
              className="w-full h-[500px] object-cover rounded-lg transition-transform transform hover:scale-105 duration-300 cursor-pointer"
              onClick={() => handleImageClick(profile.gallery?.[0] || '/default-image.jpg')}
            />
          </div>
          {profile.video && (
            <div className="relative overflow-hidden rounded-lg shadow-xl mt-4">
              <video
                src={profile.video}
                controls
                className="w-full h-48 object-cover rounded-lg transition-transform transform hover:scale-105 duration-300"
              ></video>
            </div>
          )}
        </div>

        {/* Right: Profile Info & Actions */}
        <div className="lg:w-1/2 bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
          <ProfileHeader profile={profile} statusColor={statusColor} />
          <button
            onClick={handleCreateSession}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-600 transition duration-300 w-full"
          >
            Create Session with Tutor {profile.name}
          </button>
          <ProfilePricing pricing={profile.pricing} />
          <ProfileStatusButton status={profile.status} statusColor={statusColor} lastOnline={profile.lastOnline} />
          <ProfileActions recipientId={profile.user} onSendMessage={toggleChat} />
        </div>
      </div>

      {/* Chat Section */}
      {showChat && (
        <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-auto md:w-1/3 bg-gray-800 text-white p-4 md:p-6 rounded-t-lg shadow-lg max-h-96 overflow-y-auto flex flex-col mx-4 md:mx-auto">
          <div className="flex flex-col mb-3">
            {chatMessages.length > 0 ? (
              chatMessages.map((msg, index) => (
                <div key={index} className={`p-2 ${msg.sender._id === userId ? 'text-right' : 'text-left'}`}>
                  <span
                    className={`block ${msg.sender._id === userId ? 'bg-pink-500 text-white' : 'bg-gray-700 text-gray-200'} p-2 rounded-lg mb-1`}
                  >
                    {msg.sender._id === userId ? 'You' : msg.sender.name}: {msg.content}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No messages yet.</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <textarea
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-grow p-2 rounded-lg border border-gray-700 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-softPink resize-none"
            />
            <button className="text-gray-400 hover:text-softPink">
              <FontAwesomeIcon icon={faSmile} />
            </button>
            <button onClick={handleSendMessage} className="bg-softPink text-white p-2 rounded-lg">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </div>
        </div>
      )}

      {/* Details Section */}
      {profile.role === 'tutor' ? (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: About Me with Expertise and Teaching Style */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-pink-600 mb-4">About Me</h3>
            <p className="text-gray-300 mb-4">{profile.description?.bio || 'No bio available.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold text-pink-500">Expertise</h4>
                {profile.description?.expertise?.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {profile.description.expertise.map((skill, index) => (
                      <li key={index} className="text-gray-300 text-sm">{skill}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300 text-sm">Not specified</p>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-pink-500">Teaching Style</h4>
                {profile.description?.teachingStyle?.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {profile.description.teachingStyle.map((style, index) => (
                      <li key={index} className="text-gray-300 text-sm">{style}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300 text-sm">Not specified</p>
                )}
              </div>
            </div>
          </div>
          {/* Right Column: Tutor Reviews */}
          <div>
            <TutorReviews tutorId={profile._id} />
          </div>
        </div>
      ) : (
        // If not a tutor, simply display About Me.
        <div className="mt-10 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-semibold text-pink-600 mb-4">About Me</h3>
          <p className="text-gray-300">{profile.description?.bio || 'No bio available.'}</p>
        </div>
      )}

            {/* Recommended Profiles Section */}
      <RecommendedProfiles recommended={profile.recommended} statusColor={statusColor} />

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div className="relative p-4 bg-black rounded-lg shadow-lg">
            <button
              className="absolute top-3 right-3 text-gray-300 text-2xl font-bold hover:text-gray-100 transition transform hover:scale-110 focus:outline-none"
              onClick={closeModal}
              aria-label="Close image modal"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-screen rounded-lg cursor-pointer"
              onClick={closeModal}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

const ProfileHeader = ({ profile, statusColor }) => (
  <div className="flex items-center space-x-4">
    <img
      src={profile.gallery?.[0] || '/default-avatar.jpg'}
      alt={profile.name}
      className="h-16 w-16 rounded-full shadow-lg"
    />
    <div>
    <p className="text-lg font-bold">
        <span className="text-gray-500">Tutor Category:</span>
        <span className="ml-2 text-yellow-400">{profile.category || 'Not specified'}</span>
      </p>
      <p className="text-gray-300">
        Speaks: {profile.languages?.join(', ') || 'Not specified'}
      </p>
      {profile.status && (
        <span className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${statusColor}`}>
          {profile.status}
        </span>
      )}
    </div>
  </div>
);

const ProfilePricing = ({ pricing }) => (
  <div className="space-y-1 text-sm text-gray-300">
    <p>
      Private Session (60mins):{' '}
      <span className="font-semibold text-white">
        {pricing?.privateSession || 'N/A'} <span className="text-sm text-gray-300">tokens</span>
      </span>
    </p>
    <p>
      Group Session (90mins):{' '}
      <span className="font-semibold text-white">
        {pricing?.groupSession || 'N/A'} <span className=" text-sm text-gray-300">tokens</span>
      </span>
    </p>
    <p>
      Workshop (120mins):{' '}
      <span className="font-semibold text-white">
        {pricing?.workshop || 'N/A'} <span className="text-sm text-gray-300">tokens</span>
      </span>
    </p>
    <p>
      Lecture (180mins):{' '}
      <span className="font-semibold text-white">
        {pricing?.lecture || 'N/A'} <span className="text-sm text-gray-300">tokens</span>
      </span>
    </p>
    <p className="text-yellow-400">Please Note Session Attendance minutes</p>
  </div>
);

const ProfileStatusButton = ({ status, statusColor, lastOnline }) => (
  <>
    <button className={`py-2 px-4 rounded-lg w-full mt-4 font-semibold ${statusColor} text-white`}>
      {status === 'Online' ? "I'm available" : "I'm not available"}
    </button>
    
  </>
);



const RecommendedProfiles = ({ recommended, statusColor }) => {
  const navigate = useNavigate();
  const handleProfileClick = (profileId) => {
    navigate(`/profile/${profileId}`);
  };
  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h3 className="text-xl font-semibold text-pink-600 mb-4">Recommended Tutors</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommended?.length > 0 ? (
          recommended.map((recProfile) => (
            <div
              key={recProfile._id}
              className="relative bg-gray-800 p-3 rounded-lg shadow-lg hover:shadow-xl transition duration-200 cursor-pointer flex flex-col items-center"
              onClick={() => handleProfileClick(recProfile._id)}
            >
              <img
                src={recProfile.gallery?.[0] || '/default-avatar.jpg'}
                alt={recProfile.name}
                className="rounded-lg w-32 h-48 object-cover"
              />
              <div
                className={`absolute top-2 right-2 ${
                  recProfile.status === 'Available' ? 'bg-green-500' : 'bg-gray-400'
                } text-xs px-2 py-1 rounded`}
              >
                {recProfile.status}
              </div>
              <p className="text-center mt-3 text-sm font-semibold text-white">{recProfile.name}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400">No recommended tutors available.</p>
        )}
      </div>
      <hr className="border-gray-700 my-6" />
      
    </div>
  );
};

export default ProfileDetailPage;

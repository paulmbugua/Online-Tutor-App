import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faCog, faCoins } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const Navbar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAlert, setShowAlert] = useState(false); // State for profile alert
  const { unreadMessagesCount, token, logout, language, toggleLanguage } = useContext(ShopContext);
  console.log('Unread messages count in Navbar:', unreadMessagesCount);
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fetch user profile using /me route
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }, // Pass token for authentication
        });
        // Show alert if profile does not exist
        setShowAlert(!response.data.profileExists);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (token) {
      fetchUserProfile(); // Fetch profile only if the user is logged in
    }
  }, [backendUrl, token]);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogoClick = () => {
    if (typeof onSearch === 'function') {
      onSearch(''); // Reset search if needed
    }
    navigate('/'); // Navigate to homepage route
  };

  const handleSettingsClick = () => {
    setShowAlert(false); // Hide the alert when settings is clicked
  };


  return (
    <div>
      <nav className="bg-plum text-white flex items-center justify-between px-6 py-4 shadow-lg">
        {/* Logo and Icons for Mobile */}
        <div className="flex items-center space-x-6 md:hidden">
          <button onClick={handleLogoClick} className="focus:outline-none ml-10">
            <img src={assets.logo} alt="Logo" className="h-14 w-auto" />
          </button>
          <Link to="/messages" className="relative text-sm font-medium hover:text-softPink transition-colors duration-200">
            <FontAwesomeIcon icon={faEnvelope} className="h-6 w-6" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                {unreadMessagesCount}
              </span>
            )}
          </Link>
          <Link
            to="/settings"
            className="relative text-sm font-medium hover:text-softPink transition-colors duration-200"
            onClick={handleSettingsClick}
          >
            <FontAwesomeIcon icon={faCog} className="text-lg" />
            {showAlert && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                !
              </span>
            )}
          </Link>
          <Link to="/buy-tokens" className="flex flex-col items-center text-gold hover:text-softPink transition-colors duration-200">
            <FontAwesomeIcon icon={faCoins} className="text-2xl" />
            <span className="text-sm font-medium hidden md:inline">Buy Tokens</span> {/* Hidden on mobile */}
          </Link>
          {token ? (
            <button onClick={handleLogout} className="text-sm font-medium hover:text-softPink transition-colors duration-200">
              Logout
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium hover:text-softPink transition-colors duration-200">
              Login
            </Link>
          )}
          <button onClick={toggleLanguage} className="text-sm font-medium hover:text-softPink transition-colors duration-200">
            <span className="hidden md:inline">{language}</span>
          </button>
        </div>

        {/* Logo and Centered Search Bar for Desktop */}
        <div className="hidden md:flex items-center w-full justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <button onClick={handleLogoClick} className="focus:outline-none">
              <img src={assets.logo} alt="Logo" className="h-10 w-auto" />
            </button>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-grow max-w-lg mx-auto">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search Tutors or Subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-l-lg border border-softPink text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softPink"
              />
              <button
                onClick={handleSearch}
                className="bg-softPink text-white font-medium px-4 py-2 rounded-r-lg hover:bg-secondary transition-colors duration-200"
              >
                Search
              </button>
            </div>
          </div>

          {/* Desktop Icons with Spacing */}
          <div className="flex items-center space-x-6">
            <Link to="/messages" className="relative text-sm font-medium hover:text-softPink transition-colors duration-200">
              <FontAwesomeIcon icon={faEnvelope} className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link
              to="/settings"
              className="relative text-sm font-medium hover:text-softPink transition-colors duration-200"
              onClick={handleSettingsClick}
            >
              <FontAwesomeIcon icon={faCog} className="text-lg" />
              {showAlert && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                  !
                </span>
              )}
            </Link>
            <Link to="/buy-tokens" className="flex flex-col items-center text-gold hover:text-softPink transition-colors duration-200">
              <FontAwesomeIcon icon={faCoins} className="text-2xl" />
              <span className="text-sm font-medium hidden md:inline">Buy Tokens</span>
            </Link>
            {token ? (
              <button onClick={handleLogout} className="text-sm font-medium hover:text-softPink transition-colors duration-200">
                Logout
              </button>
            ) : (
              <Link to="/login" className="text-sm font-medium hover:text-softPink transition-colors duration-200">
                Login
              </Link>
            )}
            <button onClick={toggleLanguage} className="text-sm font-medium hover:text-softPink transition-colors duration-200">
              <span className="hidden md:inline">{language}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar */}
<div className="md:hidden bg-plum p-4">
  <div className="flex items-center">
    <input
      type="text"
      placeholder="Search Tutors or Subjects..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="flex-grow p-1 text-sm rounded-l-lg border border-softPink text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-softPink"
    />
    <button
      onClick={handleSearch}
      className="bg-softPink text-white text-sm font-medium px-2 py-1 rounded-r-lg hover:bg-secondary transition-colors duration-200"
    >
      Search
    </button>
  </div>
</div>

    </div>
  );
};

export default Navbar;

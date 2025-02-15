import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileGrid from '../components/ProfileGrid';
import Footer from '../components/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const HomePage = () => {
  const [profiles, setProfiles] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Check if user has created a profile
  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const userId = localStorage.getItem('userId'); // Assume user ID is stored on login
        const response = await axios.get(`${backendUrl}/api/users/${userId}`);
        const hasProfile = response.data.profileExists; // Adjust this based on your backend response
        setShowProfileAlert(!hasProfile && !localStorage.getItem('profileAlertDismissed'));
      } catch (error) {
        console.error('Failed to check profile status:', error);
      }
    };
    checkProfileStatus();
  }, [backendUrl]);

  // Fetch profiles on component mount
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/profile/`);
        setProfiles(response.data.profiles);
        setFilteredProfiles(response.data.profiles);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [backendUrl]);

  const handleSearch = (searchTerm) => {
    const filtered = profiles.filter((profile) =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProfiles(filtered);
  };

  const onFilterChange = (filterType, value) => {
    let filtered;

    if (filterType === 'section') {
      if (value === 'All Tutors') {
        filtered = profiles;
      } else if (value === 'Available Now') {
        filtered = profiles.filter((profile) => profile.status === 'Available');
      } else {
        filtered = profiles.filter((profile) => profile.section === value);
      }
    } else if (filterType === 'category') {
      filtered = profiles.filter((profile) => profile.category === value);
    } else if (filterType === 'ageGroup') {
      filtered = profiles.filter((profile) => profile.ageGroup.includes(value));
    } else if (filterType === 'pricing') {
      const [min, max] = value.split('-').map(Number);
      filtered = profiles.filter(
        (profile) =>
          (profile.pricing.privateSession >= min && profile.pricing.privateSession <= max) ||
          (profile.pricing.groupSession >= min && profile.pricing.groupSession <= max) ||
          (profile.pricing.lecture >= min && profile.pricing.lecture <= max) ||
          (profile.pricing.workshop >= min && profile.pricing.workshop <= max)
      );
    } else if (['experienceLevel', 'teachingStyle', 'specialties', 'languageFluency'].includes(filterType)) {
      filtered = profiles.filter((profile) => profile[filterType] === value);
    } else {
      filtered = profiles;
    }

    setFilteredProfiles(filtered);
  };

  const handleSettingsClick = () => {
    setShowProfileAlert(false);
    localStorage.setItem('profileAlertDismissed', 'true');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-white">Loading tutor profiles...</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-softGray">
      {/* Top Navbar with Search Functionality */}
      <Navbar onSearch={handleSearch} onSettingsClick={handleSettingsClick} showAlert={showProfileAlert} />

      {/* Sidebar Toggle Button for Mobile */}
      <button
        className="md:hidden absolute top-4 left-4 z-30 bg-plum text-white p-2 rounded-lg focus:outline-none shadow-lg"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} size="lg" />
      </button>

      {/* Main Content Area */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-20 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:translate-x-0 transition-transform duration-300 ease-in-out bg-plum text-white w-64 shadow-xl rounded-r-lg`}
        >
          <Sidebar onFilterChange={onFilterChange} />
        </div>

        {/* Main Profile Content */}
        <div className="flex-grow overflow-y-auto p-6">
          <ProfileGrid profiles={filteredProfiles} />
          <Footer />
        </div>
      </div>

      {/* Overlay to close sidebar on mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default HomePage;

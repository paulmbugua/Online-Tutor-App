import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faUserCircle, faEdit, faThLarge, faQuestionCircle, faGlobe, faPowerOff } from '@fortawesome/free-solid-svg-icons';
import CreateProfileForm from '../components/CreateProfileForm';
import ManageProfileForm from '../components/ManageProfileForm';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const paymentSuccess = queryParams.get('success') === 'true';

  const { token, backendUrl, tokens, userEmail } = useContext(ShopContext) || {};
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  const [user, setUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Show toast notification if payment was successful
  useEffect(() => {
    if (paymentSuccess) {
      toast.success('Payment was successful! Your tokens have been updated.');
    }
  }, [paymentSuccess]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!token) {
          console.log('Token is missing. Redirecting to login.');
          toast.error('Please log in to access settings.');
          navigate('/login');
          return;
        }

        console.log('Fetching profile with token:', token);

        const response = await axios.get(`${backendUrl}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Profile API Response:', response.data);

        if (response.data.profileExists) {
          const { profile } = response.data;

          if (Array.isArray(profile.gallery)) {
            console.log('Gallery array:', profile.gallery);
          } else {
            console.warn('Gallery is not an array or is missing.');
          }

          setHasProfile(true);
          setProfileImage(profile.gallery?.[0] || '/default-avatar.jpg');
        } else {
          console.warn('Profile does not exist.');
          setHasProfile(false);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    const fetchAccountDetails = async () => {
      try {
        if (!token) {
          console.warn('Token is missing. Skipping account details fetch.');
          return;
        }

        const userResponse = await axios.get(`${backendUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = {
          userId: userResponse.data.userId,
          email: userResponse.data.email,
          tokens: userResponse.data.tokens,
        };
        setUser(userData);

        const transactionResponse = await axios.get(`${backendUrl}/api/payment/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(transactionResponse.data.transactions || []);
      } catch (error) {
        console.error('Error fetching account details:', error.response?.data || error.message);
      }
    };

    // Redirect to "My Account" if flag is set in localStorage
    const redirectToAccount = localStorage.getItem('redirectToAccount');
    if (redirectToAccount) {
      setActiveSection('account');
      localStorage.removeItem('redirectToAccount'); // Clear flag
    }

    fetchProfile();
    fetchAccountDetails();
  }, [backendUrl, token, navigate]);

  const logout = () => {
    toast.info('Logged out successfully.');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-800 text-white">
        <p className="animate-pulse">Loading...</p>
      </div>
    );
  }


  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="w-full max-w-4xl bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
            <div className="flex flex-col items-center md:flex-row md:items-start gap-4 md:gap-6">
              <img
                src={profileImage || '/default-avatar.jpg'}
                alt="Profile"
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-pink-500"
              />
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-semibold">{user?.name || 'User'}</h2>
                <p className="text-sm md:text-base text-gray-400">{userEmail}</p>
              </div>
            </div>

  
            {/* Token Balance */}
            <div className="mt-6">
              <h2 className="text-lg md:text-xl font-semibold text-pink-400">Token Balance</h2>
              <p className="text-xl md:text-2xl font-bold text-white mt-2">{tokens || 0} Tokens</p>
            </div>
  
            {/* Transaction History */}
            <div className="mt-6">
  <h2 className="text-lg md:text-xl font-semibold text-pink-400">Transaction History</h2>
  {transactions.length > 0 ? (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="bg-gray-700 text-gray-300">
            <th className="p-2 md:p-3 border-b border-gray-600 text-sm md:text-base">Date</th>
            <th className="p-2 md:p-3 border-b border-gray-600 text-sm md:text-base">Transaction ID</th>
            <th className="p-2 md:p-3 border-b border-gray-600 text-sm md:text-base">Amount</th>
            <th className="p-2 md:p-3 border-b border-gray-600 text-sm md:text-base">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr
              key={tx.transactionId || index}
              className="hover:bg-gray-700 transition-colors"
            >
              <td className="p-2 md:p-3 border-b border-gray-600 text-gray-300 text-xs md:text-sm">
                {new Date(tx.date).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
              </td>
              <td className="p-2 md:p-3 border-b border-gray-600 text-gray-300 text-xs md:text-sm truncate max-w-[120px]">
                {tx.transactionId}
              </td>
              <td className="p-2 md:p-3 border-b border-gray-600 text-gray-300 text-xs md:text-sm">
                Ksh {tx.amount}
              </td>
              <td
                className={`p-2 md:p-3 border-b border-gray-600 font-semibold text-xs md:text-sm ${
                  tx.status === 'Completed' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {tx.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="text-gray-400 mt-4">No transactions available.</p>
  )}
</div>

          </div>
        );
      case 'manageProfile':
        return hasProfile ? <ManageProfileForm /> : <CreateProfileForm />;
      case 'display':
        return <div>Display Settings</div>;
      case 'help':
        return <div>Help Center</div>;
      case 'language':
        return <div>Language Settings</div>;
      default:
        return <div>Account Details</div>;
    }
  };
  

  return (
    <div className="flex h-screen bg-darkGray text-white relative">
      <button
        onClick={() => navigate('/')}
        className="fixed top-16 left-4 md:absolute md:top-6 md:left-6 bg-pink-500 hover:bg-pink-600 
                   text-white py-2 px-4 rounded-full shadow-lg transition-all flex items-center gap-2 z-50"
      >
        <FontAwesomeIcon icon={faChevronLeft} />
        Back
      </button>

      {/* Sidebar */}
      <div className="w-72 bg-gradient-to-b from-plum to-purple-700 p-6 shadow-lg hidden md:block">
        <h2 className="text-3xl font-bold mb-8 border-b border-pink-400 pb-2">Settings</h2>
        <div className="space-y-5">
          {[{ id: 'account', label: 'My Account', icon: faUserCircle },
            { id: 'manageProfile', label: hasProfile ? 'Manage Profile' : 'Create Profile', icon: faEdit },
            { id: 'display', label: 'Display', icon: faThLarge },
            { id: 'help', label: 'Help Center', icon: faQuestionCircle },
            { id: 'language', label: 'Your Language', icon: faGlobe },
            { id: 'logout', label: 'Log Out', icon: faPowerOff, action: logout },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => (item.id === 'logout' ? item.action() : setActiveSection(item.id))}
              className="flex items-center gap-4 w-full text-lg font-medium transition-all duration-300 
              text-pink-400 hover:text-pink-500"
            >
              <FontAwesomeIcon icon={item.icon} className="text-2xl" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 md:p-12 bg-gray-900 rounded-tl-lg overflow-y-auto flex flex-col items-center sm:items-start">
        <h2 className="text-3xl font-extrabold text-pink-300 mb-8 text-center sm:text-left">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h2>
        {renderActiveSection()}
      </div>

      {/* Mobile Footer */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-plum to-purple-800 p-4 shadow-lg">
        <div className="flex justify-around">
          {[{ id: 'account', label: 'My Account', icon: faUserCircle },
            { id: 'manageProfile', label: hasProfile ? 'Manage Profile' : 'Create Profile', icon: faEdit },
            { id: 'display', label: 'Display', icon: faThLarge },
            { id: 'help', label: 'Help Center', icon: faQuestionCircle },
            { id: 'language', label: 'Language', icon: faGlobe },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="flex flex-col items-center gap-1 text-sm font-medium text-pink-400 hover:text-pink-500"
            >
              <FontAwesomeIcon icon={item.icon} className="text-2xl" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;

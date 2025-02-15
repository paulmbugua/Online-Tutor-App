import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { assets } from '../assets/assets';
import Spinner from '../components/Spinner';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// Inline TutorRating component declaration
const TutorRating = ({ rating, totalReviews }) => {
  const roundedRating = Math.round(rating * 2) / 2;
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    if (roundedRating >= i) {
      stars.push(<FaStar key={i} className="text-yellow-500" />);
    } else if (roundedRating + 0.5 === i) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-500" />);
    }
  }
  
  return (
    <div className="flex items-center">
      {stars}
      <span className="ml-2 text-xs text-gray-200">
        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
};

const PaymentPage = () => {
  const { token, backendUrl, userEmail, setTokenBalance } = useContext(ShopContext);
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  
  // Payment flow states
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [transactionReference, setTransactionReference] = useState(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  
  // Tutor rating data state
  const [ratingData, setRatingData] = useState({ avgRating: 0, totalReviews: 0 });

  useEffect(() => {
    console.log("Selected Package:", selectedPackage);
    console.log("Selected Payment Method:", selectedPaymentMethod);
  }, [selectedPackage, selectedPaymentMethod]);

  useEffect(() => {
    if (!token) return;

    const fetchPackages = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/payment/packages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched packages:', response.data);
        const sortedPackages = (Array.isArray(response.data) ? response.data : []).sort((a, b) => {
          const order = ['Basic Package', 'Standard Package', 'Premium Package'];
          return order.indexOf(a.offer) - order.indexOf(b.offer);
        });
        setPackages(sortedPackages);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    const fetchRandomProfile = async () => {
      try {
        console.log('Fetching random profile...');
        const response = await axios.get(`${backendUrl}/api/profile/random`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched random profile:', response.data);
        const profileData = response.data;
        if (profileData?.role === 'tutor') {
          setProfile(profileData);
          setMainImage(profileData?.gallery?.[0] || '/default-image.jpg');
        } else {
          setProfile(null);
          setMainImage('/default-image.jpg');
        }
      } catch (error) {
        console.error('Error fetching random profile:', error.response?.data || error.message);
        setProfile(null);
        setMainImage('/default-image.jpg');
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchPackages();
    fetchRandomProfile();
  }, [backendUrl, token]);

  // Fetch tutor rating data (declared inline) similar to ProfileCard
  useEffect(() => {
    if (profile && profile.role === 'tutor') {
      axios
        .get(`${backendUrl}/api/reviews?tutorId=${profile._id}`)
        .then((res) => {
          setRatingData({
            avgRating: res.data.avgRating,
            totalReviews: res.data.totalReviews,
          });
        })
        .catch((error) => {
          console.error('Error fetching tutor reviews:', error.response?.data || error.message);
        });
    }
  }, [profile, backendUrl]);

  const handlePackageSelection = (pkg) => {
    console.log("Package selected:", pkg);
    setSelectedPackage(pkg);
  };

  const handlePaymentSelection = (method) => {
    let backendPaymentMethod;
    switch (method) {
      case 'M-Pesa':
        backendPaymentMethod = 'MPESA';
        setShowMpesaModal(true);
        setSelectedPaymentMethod(backendPaymentMethod);
        break;
      case 'Visa/MasterCard':
        backendPaymentMethod = 'CARD';
        break;
      case 'PayPal':
        backendPaymentMethod = 'PAYPAL';
        break;
      case 'Cryptos':
        backendPaymentMethod = 'CRYPTO';
        break;
      default:
        backendPaymentMethod = null;
    }
    if (backendPaymentMethod !== 'MPESA') {
      console.log("Payment method selected:", backendPaymentMethod);
      setSelectedPaymentMethod(backendPaymentMethod);
    }
  };

  const handleInitiateMpesaPayment = async () => {
    if (!phoneNumber) {
      alert('Please enter your Safaricom phone number.');
      return;
    }
    if (!selectedPackage || !selectedPaymentMethod) {
      alert('Please select a package and payment method.');
      return;
    }

    setInitiatingPayment(true);
    const payload = {
      amount: selectedPackage.price,
      email: userEmail,
      packageId: selectedPackage._id,
      paymentMethod: 'MPESA',
      phone: phoneNumber,
    };

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/payment/initiate`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("STK Push response:", data);
      if (data?.transactionId) {
        setTransactionReference(data.transactionId);
        alert('STK Push initiated. Please complete the payment on your phone.');
      } else if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        console.error('Unexpected backend response:', data);
      }
    } catch (error) {
      console.error('Error initiating payment:', error.response?.data || error.message);
    } finally {
      setInitiatingPayment(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!transactionReference) {
      alert('No transaction reference available. Please initiate payment first.');
      return;
    }
    setPollingPayment(true);
  
    let retryCount = 0;
    const maxRetries = 18;
  
    const interval = setInterval(async () => {
      retryCount++;
      try {
        const response = await axios.get(
          `${backendUrl}/api/payment/confirm/${transactionReference}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Payment confirmation response:', response.data);
        if (response.data && response.data.success) {
          setPaymentConfirmed(true);
          clearInterval(interval);
          alert('Payment confirmed successfully.');
          navigate('/settings/account');
        }
      } catch (error) {
        if (error.response && error.response.status === 400 && error.response.data.message === 'Payment not completed yet.') {
          console.log('Payment still processing... Retry count:', retryCount);
        } else {
          console.error('Error checking payment status:', error.response?.data || error.message);
        }
      }
  
      if (retryCount >= maxRetries) {
        clearInterval(interval);
        setPollingPayment(false);
        alert('Payment confirmation timed out. Please try again later or contact support.');
      }
    }, 5000);
  };

  const handleCheckout = () => {
    alert('Checkout functionality coming soon...');
  };

  return (
    <div className="bg-gray-900 text-gray-300 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-4 md:p-8 lg:p-12">
        <h1 className="text-xl md:text-3xl font-light text-softPink mb-2">
          Get Session Tokens
        </h1>
        <p className="text-center max-w-2xl text-gray-400 text-sm md:text-lg mb-4">
          Select your token package first, then choose a payment method to book tutoring sessions with ease.
        </p>
        <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl">
          {/* Tutor Display Section */}
          <div className="hidden lg:flex bg-gray-800 p-6 rounded-lg shadow-md w-full lg:w-1/2 text-center flex-col items-center">
            {loadingProfile ? (
              <p className="text-sm">Loading tutor profile...</p>
            ) : profile ? (
              <>
                <div className="w-full h-[500px] overflow-hidden mb-4">
                  <img
                    src={mainImage}
                    alt={profile?.name || 'Tutor'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-lg md:text-xl font-semibold text-softPink">
                  {profile.name}
                </p>
                <div className="max-w-4xl mx-auto mt-4 bg-gray-800 p-4 rounded-lg shadow-md">
                  <span className="font-semibold text-pink-500">Category:</span>
                  <p className="text-gray-300 mt-1 text-xs md:text-sm">
                    {profile.category || 'Not specified'}
                  </p>
                </div>
                <div className="max-w-4xl mx-auto mt-2 bg-gray-800 p-4 rounded-lg shadow-md">
                  <span className="font-semibold text-pink-500">Expertise:</span>
                  {profile.expertise?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.expertise.map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 border border-pink-500 text-gray-300 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 mt-1 text-xs">Not specified</p>
                  )}
                </div>
                <div className="max-w-4xl mx-auto mt-2 bg-gray-800 p-4 rounded-lg shadow-md">
                  <span className="font-semibold text-pink-500">Teaching Style:</span>
                  {profile.teachingStyle?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.teachingStyle.map((style, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 border border-pink-500 text-gray-300 rounded-full text-xs"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-300 mt-1 text-xs">Not specified</p>
                  )}
                </div>
                {/* Tutor Rating using inline TutorRating */}
                <div className="max-w-4xl mx-auto mt-2 bg-gray-800 p-4 rounded-lg shadow-md">
                  <span className="font-semibold text-pink-500">Rating:</span>
                  <TutorRating rating={ratingData.avgRating} totalReviews={ratingData.totalReviews} />
                </div>
              </>
            ) : (
              <p className="text-sm">No tutor profile found.</p>
            )}
          </div>

          <div className="flex flex-col gap-6 w-full lg:w-1/2">
            {/* Heading for Packages */}
            <h2 className="text-lg md:text-2xl font-bold text-softPink mb-3">
              Choose Your Package
            </h2>
            {/* Package Selection */}
            {packages.length > 0 ? (
              packages.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => handlePackageSelection(pkg)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors text-xs md:text-base ${
                    selectedPackage?._id === pkg._id
                      ? 'border-softPink bg-gray-700'
                      : 'border-gray-600'
                  }`}
                >
                  <h3 className="font-semibold text-gray-200">{pkg.credits} Tokens</h3>
                  <p className="text-gray-400">{pkg.offer}</p>
                  <span className="text-base font-bold text-softPink">
                    Kshs {pkg.price}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm">No packages available.</p>
            )}

            {/* Payment Method Section */}
            <div className="relative bg-gray-800 p-6 rounded-lg shadow-md">
              {!selectedPackage && (
                <div className="absolute inset-0 bg-softPink bg-opacity-50 rounded-lg flex items-center justify-center">
                  <p className="text-white font-semibold text-xs">
                    Please select a package first
                  </p>
                </div>
              )}
              <h2 className="text-lg md:text-2xl font-semibold text-gray-300 mb-3">
                Choose Your Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handlePaymentSelection('Visa/MasterCard')}
                  className="w-full h-16 bg-white p-2 rounded-md flex items-center justify-center hover:bg-softPink transition-colors"
                >
                  <img
                    src={assets.visamaster}
                    alt="Visa and MasterCard"
                    className="w-full h-full object-contain"
                  />
                </button>
                <button
                  onClick={() => handlePaymentSelection('M-Pesa')}
                  className="w-full h-16 bg-white p-2 rounded-md flex items-center justify-center hover:bg-softPink transition-colors"
                >
                  <img
                    src={assets.mpesa}
                    alt="M-Pesa"
                    className="w-full h-full object-contain"
                  />
                </button>
                <button
                  onClick={() => handlePaymentSelection('PayPal')}
                  className="w-full h-16 bg-white p-2 rounded-md flex items-center justify-center hover:bg-softPink transition-colors"
                >
                  <img
                    src={assets.paypal}
                    alt="PayPal"
                    className="w-full h-full object-contain"
                  />
                </button>
                <button
                  onClick={() => handlePaymentSelection('Cryptos')}
                  className="w-full h-16 bg-white p-2 rounded-md flex items-center justify-center hover:bg-softPink transition-colors"
                >
                  <img
                    src={assets.crypto}
                    alt="Cryptocurrency"
                    className="w-full h-full object-contain"
                  />
                </button>
              </div>
              {selectedPaymentMethod && selectedPaymentMethod !== 'MPESA' && (
                <button
                  className="w-full mt-4 py-2 rounded-md font-semibold text-white bg-softPink hover:bg-pink-600 transition-colors text-xs md:text-base"
                  onClick={handleCheckout}
                >
                  {`Buy ${selectedPackage?.credits || 0} Tokens`}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* M-Pesa Modal */}
      {showMpesaModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-softPink">
              Complete M-Pesa Payment
            </h3>
            <p className="text-gray-300 text-xs md:text-sm mb-4">
              Enter your Safaricom phone number below. First, initiate the payment to receive an STK push.
            </p>
            <label className="block mb-4">
              <span className="text-gray-300 text-xs md:text-sm">Phone Number</span>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 2547XXXXXXXX"
                className="w-full p-2 border rounded mt-1 focus:outline-none focus:ring-2 focus:ring-softPink text-black text-xs md:text-sm placeholder-gray-500"
              />
            </label>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowMpesaModal(false)}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateMpesaPayment}
                disabled={initiatingPayment}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
              >
                {initiatingPayment ? <Spinner size="small" /> : 'Initiate Payment'}
              </button>
              <button
                onClick={handleCompletePayment}
                disabled={pollingPayment}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
              >
                {pollingPayment ? <Spinner size="small" /> : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;

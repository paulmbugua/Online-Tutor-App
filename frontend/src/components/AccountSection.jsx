import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner'; 

const AccountSection = () => {
  const { token, backendUrl, tokens, userEmail, setTokens, refreshUserDetails } = useContext(ShopContext);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({ tutorId: '', sessionId: '', rating: '', comment: '' });
  const [user, setUser] = useState({ email: userEmail, tokens });
  const [transactions, setTransactions] = useState([]);
  const [accountDetails, setAccountDetails] = useState({});
  const [role, setRole] = useState('');
  const [cancelReasons, setCancelReasons] = useState({});
  const [activeTab, setActiveTab] = useState('overview'); // Tabs: overview, transactions, sessions, reviews, earnings
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ tutorId: '', subject: '', date: '', comment: '', rating: '', sessionType: '', sessionCost: '' });

  useEffect(() => {
    if (token) {
      refreshUserDetails();
    }
  }, [token, refreshUserDetails]);
  
  // Fetch account details and transactions
    const fetchAccountDetails = async () => {
      try {
        if (!token) {
          console.warn('Token is missing. Skipping account details fetch.');
          return;
        }
    
        // Fetch user details
        const userResponse = await axios.get(`${backendUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = userResponse.data;
    
        console.log('User API Response:', userData);
    
        // Fetch profile details
        const profileResponse = await axios.get(`${backendUrl}/api/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = profileResponse.data;
    
        console.log('Profile API Response:', profileData);
    
        // Set user and profile details
        setUser({
          userId: userData.userId,
          email: userData.email,
          name: profileData.profileExists ? profileData.profile.name || 'Guest' : userData.name || 'Guest',
          profileImage: profileData.profileExists ? profileData.profile.gallery?.[0] || '/default-avatar.jpg' : '/default-avatar.jpg',
          tokens: userData.tokens || 0,
          role: profileData.profileExists ? profileData.profile.role : null, // Get role from profile
        });
        setRole(profileData.profileExists ? profileData.profile.role : null); // Set role from profile
      } catch (error) {
        console.error('Error fetching account details:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/payment/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched Transactions:', response.data.data); // Debug response
        setTransactions(response.data.data || []); // Update transactions state
      } catch (error) {
        console.error('Error fetching transactions:', error.response?.data || error.message);
      }
    };

    useEffect(() => {
      const fetchUpdatedTokenBalance = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/user/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data && response.data.tokens !== undefined) {
            // Update global context and local state
            setTokenBalance(response.data.tokens);
            setUser(prev => ({ ...prev, tokens: response.data.tokens }));
            console.log('Updated token balance:', response.data.tokens);
          }
        } catch (error) {
          console.error('Error fetching updated token balance:', error.response?.data || error.message);
        }
      };
  
      // Fetch updated token balance on component mount
      if (token) {
        fetchUpdatedTokenBalance();
      }
    }, [backendUrl, token, setTokens,tokens]);
  
    useEffect(() => {
      console.log('Fetching account details...');
      fetchAccountDetails();
      fetchTransactions(); // Fetch transactions separately
    }, [token, backendUrl]);
    
   
    const handleCancelReasonChange = (sessionId, reason) => {
    setCancelReasons((prev) => ({ ...prev, [sessionId]: reason }));
  };

  const confirmCancelSession = (sessionId, role, status) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      handleCancelSession(sessionId, role, status);
    }
  };

  const handleAcceptSession = async (sessionId) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/tutor-session/${sessionId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      alert('Session accepted successfully and student notified.');
      fetchDataByType('session'); // Refresh session data
    } catch (error) {
      console.error('Error accepting session:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to accept session.');
    }
  };
  
  
  const handleCancelSession = async (sessionId, role, status) => {
    const reason = cancelReasons[sessionId] || '';
  
    console.log('Cancel Session:', {
      sessionId,
      role,
      status,
      reason,
      token,
    });
  
    // Validate reason
    if (!reason.trim()) {
      alert('Please provide a reason for cancellation.');
      return;
    }
  
    // Role-based validation for session cancellation
    if (role === 'tutor' && status !== 'upcoming') {
      alert('Tutors can only cancel sessions that are "upcoming."');
      return;
    }
  
    if (role === 'student' && status !== 'accepted') {
      alert('Students can only cancel sessions that are "accepted."');
      return;
    }
  
    try {
      const response = await axios.put(
        `${backendUrl}/api/tutor-session/${sessionId}/cancel`,
        { reason }, // Send only the reason in the body
        {
          headers: { Authorization: `Bearer ${token}` }, // Include the token to infer userId on the backend
        }
      );
  
      console.log('Response:', response.data); // Log success response
      alert('Session cancelled successfully.');
      fetchDataByType('session'); // Refresh session data
    } catch (error) {
      console.error('Error cancelling session:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to cancel the session.');
    }
  };
  
  
  // Fetch data by type (sessions, reviews, earnings)
  const fetchDataByType = async (type) => {
    try {
      const response = await axios.get(`${backendUrl}/api/tutor-session/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log(`${type} Data Response:`, response.data); // Debug response structure
  
      // Update account details with fetched data
      setAccountDetails((prev) => ({
        ...prev,
        [type]: response.data?.data || [],
      }));
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error.response?.data || error.message);
    }
  };
  

  // Handle session creation
  const handleSessionCreation = async () => {
    console.log('Form Data before submission:', formData); // Debugging payload
  
    try {
      const { tutorId, subject, sessionType, sessionCost, date } = formData;
  
      // Send session creation request
      const response = await axios.post(
        `${backendUrl}/api/tutor-session/session/create`,
        { tutorId, subject, sessionType, sessionCost, date }, // Ensure keys match backend schema
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      alert('Session created successfully.');
      fetchDataByType('session'); // Refresh session data
    } catch (error) {
      console.error('Error creating session:', error.response?.data || error.message);
  
      // Handle insufficient token error
      if (
        error.response?.status === 400 &&
        error.response?.data?.message?.includes('Insufficient tokens')
      ) {
        const tokenDifference = error.response.data.message.match(/\d+/)?.[0]; // Extract token difference if available
        if (tokenDifference) {
          alert(
            `You need ${tokenDifference} more tokens to book this session. Please buy more tokens to proceed.`
          );
          navigate('/buy-tokens'); // Redirect user to token purchase page
        } else {
          alert('Insufficient tokens to book this session. Please buy more tokens.');
          navigate('/buy-tokens'); // Redirect user to token purchase page
        }
      } else {
        // General error handling
        alert(error.response?.data?.message || 'Failed to create session.');
      }
  
      // Log detailed validation error, if available
      if (error.response?.data?.details) {
        console.error('Validation Details:', error.response.data.details);
      }
    }
  };
  
  
  const handleCompletePending = async (sessionId) => {
    console.log('Initiating complete-pending process for session:', sessionId);
  
    try {
      const response = await axios.put(
        `${backendUrl}/api/tutor-session/session/complete-pending`, 
        { sessionId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      console.log('Complete-Pending API Response:', response.data);
      alert('Session marked as complete-pending. Awaiting student confirmation.');
  
      // ✅ Update UI immediately without waiting for a re-fetch
      setAccountDetails((prev) => ({
        ...prev,
        session: prev.session.map((s) =>
          s._id === sessionId ? { ...s, status: 'completed_pending' } : s
        ),
      }));
    } catch (error) {
      console.error('Error marking session as complete-pending:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to mark the session as complete-pending.');
    }
  };
  
   
  const handleConfirmComplete = async (sessionId) => {
    try {
      console.log('🔹 handleConfirmComplete called with sessionId:', sessionId);
  
      const response = await axios.put(
        `${backendUrl}/api/tutor-session/session/confirm-completion`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      console.log('🔹 Response from confirm-completion:', response.data);
      alert('Session confirmed as complete.');
  
      // Use the session returned in the response to update state.
      if (response.data?.session) {
        setAccountDetails(prev => ({
          ...prev,
          session: prev.session.map(s =>
            s._id === sessionId ? { ...s, status: response.data.session.status } : s
          )
        }));
  
        // Debug: log the session we will use for the modal
        console.log('Completed session data:', response.data.session);
        setRatingData({
          tutorId: response.data.session.tutorId?._id || response.data.session.tutorId,
          sessionId: sessionId,
          rating: '',
          comment: ''
        });
        setShowRatingModal(true);
        console.log('Rating modal state set to true.');
      } else {
        console.log('No session data returned from API.');
      }
    } catch (error) {
      console.error('Error confirming session as complete:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to confirm session completion.');
    }
  };
  
  
  // NEW: Handler for submitting the rating
  const handleReviewSubmission = async () => {
    try {
      const { tutorId, comment, rating } = ratingData;
      const response = await axios.post(
        `${backendUrl}/api/reviews`,
        { tutorId, comment, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Review submitted successfully.');
      setShowRatingModal(false);
      // Optionally refresh reviews data:
      // fetchDataByType('review');
    } catch (error) {
      console.error('Error submitting review:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to submit review.');
    }
  };
  
    const handleCreateZoomLink = async (session) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/tutor-session/create-zoom-link`,
        {
          sessionId: session._id,
          topic: `Tutoring Session - ${session.tutorId?.name}`,
          startTime: session.date,
          duration: session.sessionDuration || 60,
          tutorName: session.tutorId?.name,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      setAccountDetails((prevDetails) => ({
        ...prevDetails,
        session: prevDetails.session.map((s) =>
          s._id === session._id
            ? { ...s, zoomLinks: response.data.zoomLinks } // Update zoomLinks array
            : s
        ),
      }));
  
      alert('Zoom links created successfully!');
    } catch (error) {
      console.error('Error creating Zoom links:', error.response?.data || error.message);
      alert('Failed to create Zoom links.');
    }
  };
  

  useEffect(() => {
    console.log('Fetching account details...');
    fetchAccountDetails();

    // Check for action and query parameters
    const action = queryParams.get('action');
    const tutorId = queryParams.get('tutorId');
    const subject = queryParams.get('subject');
    const pricing = queryParams.get('pricing') ? JSON.parse(queryParams.get('pricing')) : null;

    console.log('Query Parameters:', { action, tutorId, subject, pricing });

    if (action === 'createSession') {
      console.log('Switching to Sessions Tab');
      setActiveTab('sessions'); // Switch to the sessions tab
      setFormData((prev) => ({
        ...prev,
        tutorId: tutorId || '',
        subject: subject || '',
        pricing: pricing || {},
      }));
    }
  }, [token, backendUrl, location.search]);

  useEffect(() => {
    console.log('Role Updated:', role);
    if (role === 'student') {
      console.log('Fetching student-specific data...');
      fetchDataByType('session');
      fetchDataByType('review');
    } else if (role === 'tutor') {
      console.log('Fetching tutor-specific data...');
      fetchDataByType('session');
      fetchDataByType('earning');
    }
  }, [role]);
  
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }
  

  return (
    <div className="account-section bg-gray-900 text-white min-h-screen p-4 sm:p-6 md:p-10 pb-16">
      {/* Header Section */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col sm:flex-row items-center gap-6">
        {role !== 'student' && (
          <img
            src={user?.profileImage || '/default-avatar.jpg'}
            alt="Profile"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-md"
          />
        )}
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-blue-400">{user?.name || 'User Name'}</h2>
          <p className="text-gray-400">{user?.email}</p>
          {role === 'student' && <p className="text-gray-300">Tokens: {tokens}</p>}
        </div>
      </div>

        {/* Tabs Navigation */}
      <div className="tabs flex flex-wrap justify-center sm:justify-start gap-4 mt-6 border-b border-gray-700 pb-2">
        <button
          className={`tab px-4 py-2 rounded ${
            activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab px-4 py-2 rounded ${
            activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        {role === 'student' && (
          <>
            <button
              className={`tab px-4 py-2 rounded ${
                activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions
            </button>
            <button
              className={`tab px-4 py-2 rounded ${
                activeTab === 'reviews' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </>
          
        )}
        {role === 'tutor' && (
          <>
            <button
              className={`tab px-4 py-2 rounded ${
                activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setActiveTab('sessions')}
            >
              Sessions
            </button>
            <button
              className={`tab px-4 py-2 rounded ${
                activeTab === 'earnings' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
            </button>
          </>
        )}
      </div>
  
      {/* Tab Content */}
      <div className="tab-content mt-6 pb-40">
        {activeTab === 'overview' && (
          <p className="text-gray-400 text-lg text-center">Welcome to your account overview.</p>
        )}
  
        {activeTab === 'transactions' && (
          <div className="transactions space-y-4">
            <h3 className="text-xl font-semibold text-blue-400">Transaction History</h3>
            {transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md">
                  <p className="text-gray-300">Type: {transaction.type}</p>
                  <p className="text-gray-300">Amount: ${Math.abs(transaction.amount)}</p>
                  <p className="text-gray-300">
                    {transaction.amount > 0 ? 'Earning' : 'Deduction'}
                  </p>
                  <p className="text-gray-300">
                    Description: {transaction.description || 'N/A'}
                  </p>
                  <p className="text-gray-300">
                    Date: {new Date(transaction.date).toLocaleDateString()}
                  </p>
                  <p className="text-gray-300">Status: {transaction.status || 'N/A'}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No transactions found.</p>
            )}
          </div>
        )}
  
        {activeTab === 'sessions' && (
          <>
            {role === 'student' && (
              <form
                className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSessionCreation();
                }}
              >
                {/* Alert Message */}
                {!formData.tutorId && (
                <div className="p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded text-sm">
                  <p>
                  "To create a session, visit the <strong>Homepage</strong>, select a tutor, and click their profile image. Use the <strong>'Create Session'</strong> button for prefilled details."
                  </p>
                </div>
              )}

              <h3 className="text-lg font-semibold mb-4 text-blue-400 ">Create a Session</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tutor ID"
                  className="block w-full p-2 rounded bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.tutorId}
                  onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Subject"
                  className="block w-full p-2 rounded bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />

                 {/* Session Selection Dropdown */}
                <select
                  className="block w-full p-2 rounded bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sessionType || ''}
                  onChange={(e) => {
                    const sessionType = e.target.value;
                    const sessionCost = formData.pricing?.[sessionType] || 0;
                    setFormData({ ...formData, sessionType, sessionCost });
                  }}
                >
                  <option value="" disabled>
                    Select Session Type
                  </option>
                  {formData.pricing &&
                    Object.entries(formData.pricing).map(([sessionType, price]) => (
                      <option key={sessionType} value={sessionType}>
                        {`${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} - ${price} Tokens`}
                      </option>
                    ))}
                </select>
                <input
                type="date"
                className="block w-full p-2 rounded bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="YYYY-MM-DD"
                value={formData.date}
                onClick={(e) => e.target.showPicker?.()} // Opens the date picker in supported browsers
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />

             </div>
              <button
                type="submit"
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
              >
                Create Session
              </button>
              </form>
            )}
            {role === 'student' && (
            <div className="space-y-4 mt-6">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Your Sessions</h3>
              {accountDetails.session?.length > 0 ? (
                accountDetails.session.map((session, index) => (
                  <div
                    key={session._id}
                    className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col gap-4"
                  >
                    <p className="text-gray-300">
                      <span className="font-semibold">Tutor Name:</span> {session.tutorId?.name || 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Session Type:</span> {session.sessionType || 'N/A'}
                    </p>
                    
                    <p className="text-gray-300">
                      <span className="font-semibold">Session Cost:</span> ${session.amount || 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Date:</span>{' '}
                      {new Date(session.date).toLocaleDateString() || 'N/A'}
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold">Status:</span>{' '}
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1) || 'N/A'}
                    </p>
                    

                    {/* Display Zoom link if session is accepted and Zoom link exists */}
                    {session.status === 'accepted' && session.zoomLinks?.length > 0 && (
                      <div className="zoom-links space-y-2">
                        <p className="text-green-500 font-semibold">Zoom Links Created:</p>
                        {session.zoomLinks.map((link, idx) => (
                          <div key={idx} className="zoom-link">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 underline"
                            >
                              Join Meeting Part {idx + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add cancellation button and reason field for accepted sessions */}
                    {session.status === 'accepted' && (
                      <div className="space-y-4">
                        <textarea
                          className="block w-full p-3 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Reason for cancellation"
                          value={cancelReasons[session._id] || ''}
                          onChange={(e) => handleCancelReasonChange(session._id, e.target.value)}
                        />
                        <button
                        className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-all duration-200"
                        onClick={() => confirmCancelSession(session._id, role, session.status)}
                      >
                        Cancel Session
                      </button>
                      </div>
                      )}
                      {session.status === 'completed_pending' && (
                        <div className="space-y-4 mt-4">
                          <p className="text-gray-400">
                            The tutor has marked this session as complete. Please confirm the completion within 24 hours.
                          </p>
                          <button
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-200"
                            onClick={() => handleConfirmComplete(session._id)}
                          >
                            Confirm Completion
                          </button>
                        </div>
                      )}
                      {/* Completed - Final Status */}
                      {session.status === 'completed' && (
                        <p className="text-green-500 text-center font-semibold">Session Completed</p>
                      )}
                      {/* Cancelled - Final Status */}
                      {session.status === 'cancelled' && (
                        <p className="text-red-500 text-center">Session Cancelled</p>
                      )}
                  </div>
                  
                ))
              ) : (
                <p className="text-gray-500">No sessions yet.</p>
              )}
            </div>
          )}

            

          </>
        )}

        {activeTab === 'sessions' && (
          <>
            {/* Tutor-specific session details */}
            {role === 'tutor' && (
              <div className="sessions space-y-6">
                <h3 className="text-xl font-semibold text-blue-400 border-b border-gray-700 pb-2">
                  Your Upcoming Sessions
                </h3>
                {accountDetails.session?.length > 0 ? (
                  accountDetails.session.map((session, index) => (
                    <div
                      key={session._id}
                      className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4"
                    >
                      
                      {/* Student Details */}
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          <span className="font-semibold">Student Name:</span>{' '}
                          {session.studentId?.name || 'N/A'}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-semibold">Student ID:</span>{' '}
                          {session.studentId?._id || 'N/A'}
                        </p>
                      </div>

                      {/* Session Details */}
                      <div className="space-y-2">
                        <p className="text-gray-300">
                          <span className="font-semibold">Session Type:</span>{' '}
                          {session.sessionType || 'N/A'}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-semibold">Session Cost:</span>{' '}
                          ${session.amount || 'N/A'}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-semibold">Subject:</span>{' '}
                          {session.subject || 'N/A'}
                        </p>
                        <p className="text-gray-300">
                          <span className="font-semibold">Date:</span>{' '}
                          {new Date(session.date).toLocaleDateString() || 'N/A'}
                        </p>
                      </div>
                      
                      {/* Actions for Tutor */}
                      {session.status === 'upcoming' ? (
                        <div className="space-y-4">
                          <button
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-all duration-200"
                            onClick={() => handleAcceptSession(session._id)}
                          >
                            Accept Session
                          </button>
                          <button
                            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-all duration-200"
                            onClick={() => handleCancelSession(session._id)}
                          >
                            Cancel Session
                          </button>
                          <textarea
                            className="block w-full p-3 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Reason for cancellation (if applicable)"
                            value={cancelReasons[session._id] || ''}
                            onChange={(e) =>
                              handleCancelReasonChange(session._id, e.target.value)
                            }
                          />
                        </div>
                      ) : session.status === 'accepted' ? (
                        <div className="space-y-4">
                          <button
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-all duration-200"
                            onClick={() =>
                              navigate(`/messages?studentId=${session.studentId?.user}`)
                            }
                          >
                            Chat with Student
                          </button>
                          {!session.zoomLinks || session.zoomLinks.length === 0 ? (
                            <button
                              className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 transition-all duration-200"
                              onClick={() => handleCreateZoomLink(session)}
                            >
                              Create Zoom Links
                            </button>
                          ) : (
                            <div className="mt-2 space-y-2">
                              <p className="text-green-500 font-semibold">Zoom Links Created:</p>
                              {session.zoomLinks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline block"
                                >
                                  Join Meeting Part {idx + 1}
                                </a>
                              ))}
                            </div>
                          )}
                          {/* Add complete-pending button */}
                          <button
                            className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-all duration-200"
                            onClick={() => handleCompletePending(session._id)}
                          >
                               Mark as Complete-Pending
                            </button>
                          </div>
                        ) : session.status === 'completed_pending' ? (
                          <p className="text-purple-500 text-center font-semibold">Complete-Pending</p>
                        ) : session.status === 'completed' ? (
                          <p className="text-green-500 text-center font-semibold">Session Completed</p>
                        ) : (
                          <p className="text-red-500 text-center">Session Cancelled</p>
                        )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No upcoming sessions found.</p>
                )}
              </div>
            )}
          </>
        )}

  
        {activeTab === 'reviews' && (
          <form
            className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleReviewSubmission();
            }}
          >
            <h3 className="text-xl font-semibold text-blue-400">Post a Review</h3>
            <input
              type="text"
              placeholder="Tutor ID"
              className="block w-full p-3 rounded bg-gray-900 text-gray-300"
              onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
            />
            <textarea
              placeholder="Comment"
              className="block w-full p-3 rounded bg-gray-900 text-gray-300"
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            />
            <input
              type="number"
              placeholder="Rating (1-5)"
              className="block w-full p-3 rounded bg-gray-900 text-gray-300"
              onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
            >
              Submit Review
            </button>
          </form>
        )}
  
        {activeTab === 'earnings' && (
          <div className="earnings space-y-4">
            <h3 className="text-xl text-blue-400 font-semibold">Your Earnings</h3>
            {accountDetails.earning?.length > 0 ? (
              accountDetails.earning.map((earning, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg shadow-md">
                  <p className="text-gray-300">Amount: ${earning.amount}</p>
                  <p className="text-gray-300">Description: {earning.description}</p>
                  <p className="text-gray-300">
                    Date: {new Date(earning.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
              ))
            ) : (
              <p className="text-gray-500">No earnings found.</p>
            )}
          </div>
          
        )}
      </div>
      {/* NEW: Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Rate Your Tutor</h2>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Rating (1-5):</label>
              <input 
                type="number" 
                min="1" 
                max="5"
                value={ratingData.rating}
                onChange={(e) =>
                  setRatingData({ ...ratingData, rating: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Comment:</label>
              <textarea 
                value={ratingData.comment}
                onChange={(e) =>
                  setRatingData({ ...ratingData, comment: e.target.value })
                }
                className="w-full p-2 rounded bg-gray-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => setShowRatingModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded"
                onClick={handleReviewSubmission}
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default AccountSection;

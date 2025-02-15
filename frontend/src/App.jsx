import React, { useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileDetailPage from './pages/ProfileDetailPage';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import CreateProfileForm from './components/CreateProfileForm';
import ManageProfileForm from './components/ManageProfileForm';
import PaymentPage from './pages/PaymentPage'; // Import the PaymentPage component
import { ShopContext } from './context/ShopContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AccountSection from './components/AccountSection';
import CookieConsentBanner from './components/CookieConsentBanner';
import CookiePolicy from './pages/CookiePolicy';
import Spinner from './components/Spinner';

// A simple protected route wrapper to guard against unauthorized access
const ProtectedRoute = ({ children }) => {
  const { token } = useContext(ShopContext); // Only use the token to check authentication
  return token ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const { token } = useContext(ShopContext); // Track token for authentication state
  const [isAppInitialized, setIsAppInitialized] = useState(true); // Initial loading state

  // Simulate app initialization (if needed for future setups like OAuth or settings)
  useEffect(() => {
    // Mimic initialization logic if necessary
    setIsAppInitialized(false); // App is ready after mounting
  }, []);

  if (isAppInitialized) return <Spinner />; // Initial loading message

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <>
      <ToastContainer
        toastClassName="p-2 rounded-lg shadow-soft"
        bodyClassName="font-sans"
        toastStyle={{ backgroundColor: '#f7f7f7', color: '#333333' }}
      />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Updated ProfileDetailPage route to include the dynamic :id parameter */}
          <Route path="/account" element={<AccountSection />} />
          <Route path="/profile/:id" element={<ProfileDetailPage />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/create" element={<ProtectedRoute><CreateProfileForm /></ProtectedRoute>} />
          <Route path="/settings/manage" element={<ProtectedRoute><ManageProfileForm /></ProtectedRoute>} />
          <Route path="/settings/account" element={<ProtectedRoute><AccountSection /></ProtectedRoute>} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          {/* New route for the PaymentPage */}
          <Route path="/buy-tokens" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} /> {/* Fallback route */}
        </Routes>
        <CookieConsentBanner />
        </>
    </GoogleOAuthProvider>
  );
};

export default App;

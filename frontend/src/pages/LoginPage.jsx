import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';

const LoginPage = () => {
  const [currentState, setCurrentState] = useState('Login'); // Toggle between Login and Sign Up
  const [forgotPassword, setForgotPassword] = useState(false); // Toggle Forgot Password state
  const [otpSent, setOtpSent] = useState(false); // Track OTP sent state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for Sign Up
  const [role, setRole] = useState(''); // Role selection for sign up or Google login
  const [newPassword, setNewPassword] = useState(''); // Only for Password Reset
  const [otp, setOtp] = useState(''); // Only for OTP

  // State for inline role selection modal (for Google login)
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { token, setToken, backendUrl } = useContext(ShopContext);
  const navigate = useNavigate();

  // Handle Google Login Success
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      // Call the backend Google login endpoint.
      const googleResponse = await axios.post(
        `${backendUrl}/api/user/google-login`,
        { token: credentialResponse.credential }
      );

      if (googleResponse.data.success) {
        // Save the token.
        setToken(googleResponse.data.token);
        localStorage.setItem('token', googleResponse.data.token);

        // Fetch the user details from the /me endpoint.
        const meResponse = await axios.get(`${backendUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${googleResponse.data.token}` }
        });

        if (meResponse.data.success) {
          // Check if the user already has a role.
          if (meResponse.data.role) {
            setRole(meResponse.data.role);
            navigate('/');
          } else {
            setShowRoleModal(true);
          }
        } else {
          toast.error('Failed to fetch user data.');
        }
      } else {
        toast.error(googleResponse.data.message);
      }
    } catch (error) {
      toast.error('Google Login failed.');
    }
  };

  // Handle Google Login Failure
  const handleGoogleLoginFailure = () => {
    toast.error('Google Login was unsuccessful. Please try again.');
  };

  // Handle OTP Request
  const handleRequestOTP = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('OTP sent to your email.');
        setOtpSent(true);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to send OTP.');
    }
  };

  // Handle OTP Verification and Password Reset
  const handleOTPVerification = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        `${backendUrl}/api/user/verify-otp`,
        { email, otp, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Password reset successful!');
        setForgotPassword(false);
        setOtpSent(false);
        setCurrentState('Login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('OTP verification failed.');
    }
  };

  // Handle Login or Sign Up Submission
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    // For sign up, ensure a role is selected
    if (currentState === 'Sign Up' && !role) {
      toast.error('Please select a role.');
      return;
    }
    try {
      const endpoint = currentState === 'Sign Up' ? '/api/user/register' : '/api/user/login';
      const payload = currentState === 'Sign Up'
        ? { name, email, password, role }
        : { email, password };

      const response = await axios.post(
        `${backendUrl}${endpoint}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        toast.success(`${currentState} Successful!`);
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Server error, please try again.');
    }
  };

  // Handle inline role update for Google login users
  const handleRoleSubmit = async (event) => {
    event.preventDefault();
    if (!role) {
      toast.error('Please select a role.');
      return;
    }
    try {
      const response = await axios.put(
        `${backendUrl}/api/user/update-role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success('Google Login Successful!');
        setShowRoleModal(false);
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to update role.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-300">
      {/* Logo */}
      <div className="mb-8">
        <Link to="/">
          <img src={assets.logo} alt="Logo" className="h-20 w-auto" />
        </Link>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        {forgotPassword ? (
          otpSent ? (
            // OTP Verification Form
            <form onSubmit={handleOTPVerification} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-softPink">Enter OTP</h2>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                placeholder="Enter OTP"
                required
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                placeholder="New Password (min. 8 characters)"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-softPink text-white font-medium hover:bg-pink-700 transition duration-200"
              >
                Reset Password
              </button>
            </form>
          ) : (
            // Request OTP Form
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <h2 className="text-2xl font-bold text-center text-softPink">Reset Password</h2>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                placeholder="Enter your email"
                required
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-softPink text-white font-medium hover:bg-pink-700 transition duration-200"
              >
                Send OTP
              </button>
              <p
                onClick={() => setForgotPassword(false)}
                className="text-gray-400 hover:text-softPink cursor-pointer text-center"
              >
                Back to Login
              </p>
            </form>
          )
        ) : (
          // Login / Sign Up Form
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-softPink">
              {currentState === 'Login' ? 'Login to FunzaSasa' : 'Sign Up for FunzaSasa'}
            </h2>
            {currentState === 'Sign Up' && (
              <>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                  placeholder="Name"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                </select>
              </>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
              placeholder="Email"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
              placeholder="Password"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-softPink text-white font-medium hover:bg-pink-700 transition duration-200"
            >
              {currentState === 'Login' ? 'Login' : 'Sign Up'}
            </button>

            <div className="flex justify-between text-sm mt-4">
              <p onClick={() => setForgotPassword(true)} className="text-gray-400 hover:text-softPink cursor-pointer">
                Forgot password?
              </p>
              {currentState === 'Login' ? (
                <p onClick={() => setCurrentState('Sign Up')} className="text-gray-400 hover:text-softPink cursor-pointer">
                  Create account
                </p>
              ) : (
                <p onClick={() => setCurrentState('Login')} className="text-gray-400 hover:text-softPink cursor-pointer">
                  Already have an account?
                </p>
              )}
            </div>
          </form>
        )}

        <div className="my-4 text-center text-gray-500">OR</div>
        <h5 className="text-lg font-semibold text-center text-gray-300 mb-2">Sign in using:</h5>

        {/* Google Login Button */}
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={handleGoogleLoginFailure}
          render={(renderProps) => (
            <button
              onClick={renderProps.onClick}
              disabled={renderProps.disabled}
              className="w-full py-3 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600 transition duration-200"
            >
              Sign up with Google
            </button>
          )}
        />
      </div>

      {/* Inline Role Selection Modal for Google Login users */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-2xl font-bold text-center text-softPink">Select Your Role</h2>
            <form onSubmit={handleRoleSubmit} className="mt-4">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-softPink focus:ring-softPink text-gray-300"
                required
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="tutor">Tutor</option>
              </select>
              <button
                type="submit"
                className="w-full mt-4 py-3 rounded-lg bg-softPink text-white font-medium hover:bg-pink-700 transition duration-200"
              >
                Save Role
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;

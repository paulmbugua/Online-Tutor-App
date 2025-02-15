import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto'; // For OTP generation
import userModel from '../models/UserModel.js';
import { OAuth2Client } from 'google-auth-library';
import { sendOTP } from '../config/emailService.js'; // Email service for OTPs

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to create JWT token
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });


/** --------------------
 *  User Login
 -------------------- */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await userModel.findOne({ email: email.trim() });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Please log in with Google as this account was registered using Google.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = createToken(user._id);
    res.json({ success: true, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};

/** --------------------
 *  User Registration
 -------------------- */
 const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Ensure all required fields are provided, including role.
    if (!name || !email?.trim() || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required, including role' });
    }
    if (!validator.isEmail(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Optionally validate the role against allowed values.
    const allowedRoles = ['student', 'tutor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }

    // Check if a user with the given email already exists.
    const exists = await userModel.findOne({ email: email.trim() });
    if (exists) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    // Hash the password before saving.
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email: email.trim(), password: hashedPassword, role });

    const user = await newUser.save();
    const token = createToken(user._id);

    res.status(201).json({ success: true, token });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};

// In userController.js

const getUser = async (req, res) => {
  try {
      const userId = req.user.id;
      console.log("getUser - Fetching user with ID:", userId);

      // Validate the userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ success: false, message: "Invalid user ID." });
      }

      // Fetch user details
      const user = await userModel.findById(userId, 'email _id tokens role'); // Added the tokens field
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found." });
      }

      // Send the user details in the response
      res.status(200).json({ 
          success: true, 
          userId: user._id, 
          email: user.email, // Include email in the response
          tokens: user.tokens || 0, // Include tokens with a default of 0 if undefined
          role: user.role
      });
  } catch (error) {
      console.error("getUser Error:", error);
      res.status(500).json({ success: false, message: "Server error." });
  }
};


/** --------------------
 *  Request Password Reset
 -------------------- */
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await userModel.findOne({ email: email.trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // Valid for 10 minutes
    await user.save();

    await sendOTP(user.email, otp); // Send OTP to user's email
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Password Reset Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};

/** --------------------
 *  Verify OTP and Reset Password
 -------------------- */
const verifyOTPAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp?.trim() || !newPassword?.trim()) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await userModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.resetOtp !== otp.trim() || Date.now() > user.otpExpiry) {
      user.resetOtp = undefined;
      user.otpExpiry = undefined;
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    user.password = hashedPassword;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};

/** --------------------
 *  Admin Login
 -------------------- */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.json({ success: true, token, message: 'Admin login successful' });
    }

    res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};

/** --------------------
 *  Google Login
 -------------------- */
const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token missing' });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    if (!email) return res.status(400).json({ success: false, message: 'Invalid Google token' });

    let user = await userModel.findOne({ email });
    if (!user) {
      user = new userModel({ name, email, googleId });
      await user.save();
    }

    const jwtToken = createToken(user._id);
    res.json({ success: true, token: jwtToken });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
};


 const updateUserRole = async (req, res) => {
  try {
    // Ensure the user is authenticated. This assumes your middleware sets req.user.
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role is required' });
    }
    
    // Validate the role against a list of allowed roles.
    const allowedRoles = ['student', 'tutor'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected' });
    }
    
    // Update the user's role in the database.
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { role },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, message: 'Role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update Role Error:', error);
    res.status(500).json({ success: false, message: 'Server error, please try again later' });
  }
};


export {
  loginUser,
  registerUser,
  adminLogin,
  googleLogin,
  requestPasswordReset,
  verifyOTPAndResetPassword,
  getUser,
  updateUserRole,
};

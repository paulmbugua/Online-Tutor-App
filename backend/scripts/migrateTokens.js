import mongoose from 'mongoose';
import User from '../models/UserModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const migrateTokens = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI, {
      
    });
    console.log('Database connected.');

    // Update tokens for all users
    const result = await User.updateMany({}, { $set: { tokens: 0 } });
    console.log(`Tokens initialized for all users. Modified: ${result.nModified}`);

    // Close the database connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error during migration:', error.message || error);
    mongoose.connection.close();
  }
};

migrateTokens();

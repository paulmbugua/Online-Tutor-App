import 'dotenv/config'; // Load .env variables
import mongoose from 'mongoose';
import connectDB from '../config/db.js'; // Existing DB connection function
import SessionType from '../models/SessionType.js'; // Adjust the path to your schema

// Debugging: Ensure MONGO_URI is loaded correctly
console.log("MONGO_URI:", process.env.MONGO_URI);

const sessionDurations = [
    { type: 'privateSession', duration: 60 },
    { type: 'groupSession', duration: 90 },
    { type: 'lecture', duration: 120 },
    { type: 'workshop', duration: 180 },
];

const seedSessionDurations = async () => {
    try {
        // Connect to the database
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear existing session types
        const deleted = await SessionType.deleteMany();
        console.log(`Deleted ${deleted.deletedCount} existing session types.`);

        // Insert new session durations
        const inserted = await SessionType.insertMany(sessionDurations);
        console.log(`Inserted ${inserted.length} new session types.`);
    } catch (error) {
        console.error('Error seeding session durations:', error);
    } finally {
        // Close the connection
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Execute the script
seedSessionDurations();

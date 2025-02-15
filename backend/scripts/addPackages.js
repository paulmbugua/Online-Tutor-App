import 'dotenv/config'; // Load .env variables
import mongoose from 'mongoose';
import connectDB from '../config/db.js'; // Existing DB connection function
import Package from '../models/Package.js';

// Debugging: Ensure MONGO_URI is loaded correctly
console.log("MONGO_URI:", process.env.MONGO_URI);

const samplePackages = [
    { credits: 20, price: 200, offer: 'Basic Package' },
    { credits: 151, price: 1499, offer: 'Standard Package' },
    { credits: 302, price: 2999, offer: 'Premium Package' },
];

const seedPackages = async () => {
    try {
        // Connect to the database
        await connectDB();
        console.log('Connected to MongoDB');

        // Clear existing packages
        const deleted = await Package.deleteMany();
        console.log(`Deleted ${deleted.deletedCount} existing packages.`);

        // Insert new packages
        const inserted = await Package.insertMany(samplePackages);
        console.log(`Inserted ${inserted.length} new packages.`);
    } catch (error) {
        console.error('Error seeding packages:', error);
    } finally {
        // Close the connection
        mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Execute the script
seedPackages();

import mongoose from 'mongoose';
import Package from './models/Package.js'; // Path to your Package model

// MongoDB connection URI
const mongoURI = 'mongodb+srv://**********************'; // Replace with your MongoDB URI

// Package data to insert
const packages = [
  { credits: 25, price: 2, offer: 'Basic Package' },
  { credits: 76, price: 1499, offer: 'Standard Package' },
  { credits: 152, price: 2999, offer: 'Premium Package' },
];

// Connect to MongoDB
const seedPackages = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing packages (optional)
    await Package.deleteMany();
    console.log('Existing packages cleared');

    // Insert new packages
    await Package.insertMany(packages);
    console.log('Packages seeded successfully:', packages);

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding packages:', error);
    mongoose.disconnect();
  }
};

// Run the script
seedPackages();

import mongoose from 'mongoose';
import Review from '../models/ReviewModel.js';
import { reviewValidationSchema } from '../validators/reviewValidator.js'; // Ensure you have a Joi schema for reviews

export const postReview = async (req, res) => {
  try {
    // Validate the input using Joi
    const { tutorId, comment, rating, sessionId } = await reviewValidationSchema.validateAsync(req.body, { stripUnknown: true });
    
    // Get the student ID from the authenticated user (assuming your auth middleware sets req.user)
    const studentId = req.user._id;
    
    // Create a new review document using the separate Review model
    const newReview = await Review.create({
      tutor: tutorId,
      student: studentId,
      session: sessionId, // optional; include if you want to track the specific session
      rating,
      comment
    });
    
    res.status(201).json({ message: 'Review posted successfully.', review: newReview });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: 'Validation error.', details: error.details });
    }
    console.error('Error posting review:', error.message || error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


// Example: GET /api/reviews?tutorId=...
export const getReviews = async (req, res) => {
    try {
      const { tutorId } = req.query;
      if (!tutorId) {
        return res.status(400).json({ message: "Tutor ID is required to fetch reviews." });
      }
  
      // Use aggregation to compute average rating and total reviews
      const aggregation = await Review.aggregate([
        { $match: { tutor: new mongoose.Types.ObjectId(tutorId) } },
        {
          $group: {
            _id: "$tutor",
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 }
          }
        }
      ]);
  
      const reviews = await Review.find({ tutor: tutorId })
        .populate("student", "name email")
        .sort({ createdAt: -1 });
  
      const aggregatedData = aggregation[0] || { avgRating: 0, totalReviews: 0 };
  
      res.status(200).json({
        message: "Reviews fetched successfully.",
        avgRating: aggregatedData.avgRating,
        totalReviews: aggregatedData.totalReviews,
        reviews
      });
    } catch (error) {
      console.error("Error fetching reviews:", error.message || error);
      res.status(500).json({ message: "Internal server error." });
    }
  };
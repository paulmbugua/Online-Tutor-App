import Joi from 'joi';

export const reviewValidationSchema = Joi.object({
  tutorId: Joi.string().required(),
  // Optional sessionId field if you want to track session reviews.
  sessionId: Joi.string().optional(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().trim().optional()
});

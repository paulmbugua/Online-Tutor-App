import Joi from 'joi';

// Joi Schema for Validation
export const sessionValidationSchema = Joi.object({
  tutorId: Joi.string().required().label('Tutor ID'),
  subject: Joi.string().required().label('Subject'),
  sessionType: Joi.string()
    .valid('privateSession', 'groupSession', 'lecture', 'workshop')
    .required()
    .label('Session Type'),
  sessionCost: Joi.number().required().label('Session Cost'), // Include sessionCost here
  date: Joi.date().required().label('Date'),
});

export const reviewValidationSchema = Joi.object({
  tutorId: Joi.string().required(),
  comment: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
});

export const completeSessionValidationSchema = Joi.object({
  sessionId: Joi.string().required(),
});
import Joi from 'joi';

const validCategories = ['Math Tutor', 'Sciences', 'Programming', 'Languages', 'Art & Design', 'Wellness'];
const validExperienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const validStatus = ['Online', 'Offline', 'Busy', 'Away', 'Free'];
const validTeachingStyles = ['One-on-One', 'Group', 'Workshop', 'Lecture'];
const validPaymentMethods = ['bank', 'mpesa'];

const pricingSchema = Joi.object({
  privateSession: Joi.number().min(20).max(150).required(),
  groupSession: Joi.number().min(15).max(80).required(),
  lecture: Joi.number().min(10).max(50).required(),
  workshop: Joi.number().min(15).max(200).required(),
});

const descriptionSchema = Joi.object({
  bio: Joi.string().min(1).required(),
  expertise: Joi.array().items(Joi.string().trim()).min(1).required(),
  teachingStyle: Joi.array().items(Joi.string().valid(...validTeachingStyles)).min(1).required(),
});

export const profileValidationSchema = Joi.object({
  role: Joi.string().valid('tutor', 'student').required(),

  // Common fields
  name: Joi.string().min(2).trim().required(),
  age: Joi.when('role', {
    is: 'tutor',
    then: Joi.number().integer().min(18).required(),
    otherwise: Joi.number().integer().min(5).required(),
  }),
  languages: Joi.array().items(Joi.string().trim()).default([]),

  // Student-specific: Only these fields are allowed
  ageGroup: Joi.when('role', {
    is: 'student',
    then: Joi.array().items(Joi.string().trim()).min(1).required(),
    otherwise: Joi.forbidden(),
  }),

  // Tutor-specific fields:
  gallery: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string().uri()).min(1).required(),
    otherwise: Joi.forbidden(),
  }),
  video: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().uri().optional(),
    otherwise: Joi.forbidden(),
  }),
  category: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validCategories).required(),
    otherwise: Joi.forbidden(),
  }),
  favorites: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string()).optional(),
    otherwise: Joi.forbidden(),
  }),
  recommended: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string()).optional(),
    otherwise: Joi.forbidden(),
  }),
  experienceLevel: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validExperienceLevels).optional(),
    otherwise: Joi.forbidden(),
  }),
  description: Joi.when('role', {
    is: 'tutor',
    then: descriptionSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  pricing: Joi.when('role', {
    is: 'tutor',
    then: pricingSchema.required(),
    otherwise: Joi.forbidden(),
  }),
  paymentMethod: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validPaymentMethods).required(),
    otherwise: Joi.forbidden(),
  }),
  bankAccount: Joi.when('paymentMethod', {
    is: 'bank',
    then: Joi.string().pattern(/^\d{6,}$/).required(),
    otherwise: Joi.forbidden(),
  }),
  bankCode: Joi.when('paymentMethod', {
    is: 'bank',
    then: Joi.string().min(3).max(10).required(),
    otherwise: Joi.forbidden(),
  }),
  mpesaPhoneNumber: Joi.when('paymentMethod', {
    is: 'mpesa',
    then: Joi.string().pattern(/^\+254(7|1)\d{8}$/).required()
      .messages({
        'string.pattern.base': 'M-Pesa phone number must be in +2547XXXXXXXX or +2541XXXXXXXX format.',
      }),
    otherwise: Joi.forbidden(),
  }),
  status: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validStatus).optional(),
    otherwise: Joi.forbidden(),
  }),
  notifications: Joi.when('role', {
    is: 'tutor',
    then: Joi.boolean().optional(),
    otherwise: Joi.forbidden(),
  }),
});

export const profileUpdateValidationSchema = Joi.object({
  role: Joi.string().valid('tutor', 'student').optional(),

  name: Joi.string().min(2).trim().optional(),
  age: Joi.number().integer().min(5).max(100).optional(),
  languages: Joi.array().items(Joi.string().trim()).optional(),
  ageGroup: Joi.array().items(Joi.string().trim()).optional(),

  gallery: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string().uri()).optional(),
    otherwise: Joi.forbidden(),
  }),
  video: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().uri().optional(),
    otherwise: Joi.forbidden(),
  }),
  category: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validCategories).optional(),
    otherwise: Joi.forbidden(),
  }),
  favorites: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string().trim()).optional(),
    otherwise: Joi.forbidden(),
  }),
  recommended: Joi.when('role', {
    is: 'tutor',
    then: Joi.array().items(Joi.string().trim()).optional(),
    otherwise: Joi.forbidden(),
  }),
  experienceLevel: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validExperienceLevels).optional(),
    otherwise: Joi.forbidden(),
  }),
  description: Joi.when('role', {
    is: 'tutor',
    then: descriptionSchema.optional(),
    otherwise: Joi.forbidden(),
  }),
  pricing: Joi.when('role', {
    is: 'tutor',
    then: pricingSchema.optional(),
    otherwise: Joi.forbidden(),
  }),
  status: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validStatus).optional(),
    otherwise: Joi.forbidden(),
  }),
  notifications: Joi.when('role', {
    is: 'tutor',
    then: Joi.boolean().optional(),
    otherwise: Joi.forbidden(),
  }),
  paymentMethod: Joi.when('role', {
    is: 'tutor',
    then: Joi.string().valid(...validPaymentMethods).optional(),
    otherwise: Joi.forbidden(),
  }),
  bankAccount: Joi.when('role', {
    is: 'tutor',
    then: Joi.when('paymentMethod', {
      is: 'bank',
      then: Joi.string().pattern(/^\d{6,}$/).optional(),
      otherwise: Joi.forbidden(),
    }),
    otherwise: Joi.forbidden(),
  }),
  bankCode: Joi.when('role', {
    is: 'tutor',
    then: Joi.when('paymentMethod', {
      is: 'bank',
      then: Joi.string().min(3).max(10).optional(),
      otherwise: Joi.forbidden(),
    }),
    otherwise: Joi.forbidden(),
  }),
  mpesaPhoneNumber: Joi.when('role', {
    is: 'tutor',
    then: Joi.when('paymentMethod', {
      is: 'mpesa',
      then: Joi.string().pattern(/^\+254(7|1)\d{8}$/).optional(),
      otherwise: Joi.forbidden(),
    }),
    otherwise: Joi.forbidden(),
  }),
});

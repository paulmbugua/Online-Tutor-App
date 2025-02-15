import Joi from 'joi';

const paymentValidationSchema = Joi.object({
  amount: Joi.number().required().messages({
    'number.base': 'Amount must be a number',
    'any.required': 'Amount is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required',
  }),
  packageId: Joi.string().required().messages({
    'any.required': 'Package ID is required',
  }),
  phone: Joi.string().pattern(/^[0-9]{10,12}$/).required().messages({
    'string.pattern.base': 'Phone number must be valid',
    'any.required': 'Phone number is required',
  }),
  paymentMethod: Joi.string()
    .valid('MPESA', 'B2C', 'CARD', 'PAYPAL', 'CRYPTO')
    .required()
    .messages({
      'any.only': 'Invalid payment method',
      'any.required': 'Payment method is required',
    }),
});


const validatePayment = (data) => paymentValidationSchema.validate(data, { abortEarly: false });

export default validatePayment;

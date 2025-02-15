import axios from 'axios';


export const initializePayment = async (amount, email) => {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amount * 100, // Paystack requires the amount in kobo
        email,
        currency: 'KES', // Update if your currency is different
        callback_url: `${process.env.FRONTEND_URL}/settings?section=account&success=true`, // Include callback
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data; // Return the response to the frontend
  } catch (error) {
    console.error('Error initializing payment:', error.response?.data || error.message);
    throw new Error('Failed to initialize payment.');
  }
};


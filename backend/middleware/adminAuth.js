import jwt from 'jsonwebtoken';

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Authorization Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Extracted Token:', token);

    const token_decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', token_decode);

    // Ensure email and role match expected values
    if (token_decode.email !== process.env.ADMIN_EMAIL || token_decode.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not1 Authorized Login Again' });
    }

    next(); // Proceed if token is valid
  } catch (error) {
    console.error('Token Verification Error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }

    res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
  }
};

export default adminAuth;

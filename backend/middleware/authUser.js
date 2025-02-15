import jwt from 'jsonwebtoken';
import { Profile } from '../models/Profile.js'; // Adjust the path to your Profile model

const authUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Not Authorized. Please login again.',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the decoded user information to `req.user`
        req.user = { _id: decodedToken.id, ...decodedToken };

        // Fetch the user's profile to include the profileId and role
        const profile = await Profile.findOne({ user: req.user._id }).select('_id role');
        if (profile) {
            req.user.profileId = profile._id; // Add profileId to `req.user`
            req.user.role = profile.role; // Add role to `req.user`
        } else {
            console.warn(`Profile not found for user ID: ${req.user._id}`);
            req.user.profileId = null; // Explicitly set profileId as null if profile is missing
            req.user.role = null; // Explicitly set role as null if profile is missing
        }

        console.log('Authenticated User with Profile and Role:', req.user); // Debugging info

        // Proceed to the next middleware/controller
        next();
    } catch (error) {
        console.error('JWT Verification or Profile Fetch Error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.',
        });
    }
};

export default authUser;

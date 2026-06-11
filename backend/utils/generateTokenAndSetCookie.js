import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "7d", // Token will expire in 7 days
	});

	res.cookie("token", token, {
		httpOnly: true, // Prevents client-side JS from accessing the cookie
		secure: process.env.NODE_ENV === "production", // Only send cookie over HTTPS in production
		sameSite: "strict", // Only send cookie for same-site requests
		maxAge: 7 * 24 * 60 * 60 * 1000, 
		// 7 days in milliseconds = 604800000 ms
		// Set the cookie to expire in 
		// 7 days (7 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second)

	});

	return token;
};

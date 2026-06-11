import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// AWS SES SMTP transporter
// Region SES: ap-southeast-1 (Singapore)
// Endpoint: email-smtp.ap-southeast-1.amazonaws.com
export const transporter = nodemailer.createTransport({
	host: process.env.SES_SMTP_HOST || "email-smtp.ap-southeast-1.amazonaws.com",
	port: Number(process.env.SES_SMTP_PORT) || 587,
	secure: false, // STARTTLS
	auth: {
		user: process.env.SES_SMTP_USER,
		pass: process.env.SES_SMTP_PASS,
	},
});

export const sender = {
	email: process.env.SES_SENDER_EMAIL,
	name: process.env.SES_SENDER_NAME || "StyleZone POS",
};

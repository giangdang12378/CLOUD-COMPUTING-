import {
	PASSWORD_RESET_REQUEST_TEMPLATE,
	PASSWORD_RESET_SUCCESS_TEMPLATE,
	VERIFICATION_EMAIL_TEMPLATE,
	INVOICE_EMAIL_TEMPLATE,
} from "./emailTemplates.js";
import { transporter, sender } from "./mailtrap.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
	try {
		const info = await transporter.sendMail({
			from: `${sender.name} <${sender.email}>`,
			to: email,
			subject: "Verify your email",
			html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
		});

		console.log("Email sent successfully", info);
	} catch (error) {
		console.error(`Error sending verification`, error);
		throw new Error(`Error sending verification email: ${error}`);
	}
};

export const sendWelcomeEmail = async (email, name) => {
	try {
		const info = await transporter.sendMail({
			from: `${sender.name} <${sender.email}>`,
			to: email,
			subject: "Welcome to Auth Company!",
			html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining Auth Company.</p>`,
		});

		console.log("Welcome email sent successfully", info);
	} catch (error) {
		console.error(`Error sending welcome email`, error);
		throw new Error(`Error sending welcome email: ${error}`);
	}
};

export const sendPasswordResetEmail = async (email, resetURL) => {
	try {
		const info = await transporter.sendMail({
			from: `${sender.name} <${sender.email}>`,
			to: email,
			subject: "Reset your password",
			html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
		});

		console.log("Password reset email sent successfully", info);
	} catch (error) {
		console.error(`Error sending password reset email`, error);
		throw new Error(`Error sending password reset email: ${error}`);
	}
};

export const sendResetSuccessEmail = async (email) => {
	try {
		const info = await transporter.sendMail({
			from: `${sender.name} <${sender.email}>`,
			to: email,
			subject: "Password Reset Successful",
			html: PASSWORD_RESET_SUCCESS_TEMPLATE,
		});

		console.log("Password reset email sent successfully", info);
	} catch (error) {
		console.error(`Error sending password reset success email`, error);
		throw new Error(`Error sending password reset success email: ${error}`);
	}
};

export const sendInvoiceEmail = async (email, invoiceData) => {
	try {
		const {
			customerName,
			storeName,
			transactionId,
			orderDate,
			paymentMethod,
			orderItems,
			subtotal,
			shippingFee,
			discountAmount,
			totalAmount,
			storeAddress,
			storePhone
		} = invoiceData;

		// Generate HTML for order items
		const itemsHtml = orderItems.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;">
                    ${item.productName}
                    ${item.variant ? `<br><small style="color: #888;">${item.variant.color || ''} ${item.variant.size || ''}</small>` : ''}
                </td>
                <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px 0; text-align: right;">${item.price.toLocaleString()}đ</td>
            </tr>
        `).join('');

		const html = INVOICE_EMAIL_TEMPLATE
			.replace(/{customerName}/g, customerName)
			.replace(/{storeName}/g, storeName)
			.replace(/{transactionId}/g, transactionId)
			.replace(/{orderDate}/g, orderDate)
			.replace(/{paymentMethod}/g, paymentMethod)
			.replace(/{orderItems}/g, itemsHtml)
			.replace(/{subtotal}/g, subtotal.toLocaleString())
			.replace(/{shippingFee}/g, shippingFee.toLocaleString())
			.replace(/{discountAmount}/g, discountAmount.toLocaleString())
			.replace(/{totalAmount}/g, totalAmount.toLocaleString())
			.replace(/{storeAddress}/g, storeAddress)
			.replace(/{storePhone}/g, storePhone);

		const info = await transporter.sendMail({
			from: `${sender.name} <${sender.email}>`,
			to: email,
			subject: `Hóa đơn đơn hàng ${transactionId} - ${storeName}`,
			html: html,
		});

		console.log("Invoice email sent successfully", info);
	} catch (error) {
		console.error(`Error sending invoice email`, error);
	}
};

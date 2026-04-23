const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text)
 */
const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Auth System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    // We throw the error so the controller knows the email failed to send
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
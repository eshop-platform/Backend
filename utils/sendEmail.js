const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body (plain text or HTML)
 */
const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const isHtml = text.trimStart().startsWith('<');
    const mailOptions = {
      from: `"PrimeCommerce" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      ...(isHtml ? { html: text } : { text }),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${email}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;
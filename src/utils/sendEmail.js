const nodemailer = require("nodemailer");

const canSendRealEmail = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const sendEmail = async (email, subject, text) => {
  if (!canSendRealEmail()) {
    console.log(`Email fallback for ${email}: ${subject} -> ${text}`);
    return { delivered: false, fallback: true };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"PrimeCommerce" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text,
  });

  return { delivered: true, fallback: false };
};

module.exports = { sendEmail, canSendRealEmail };

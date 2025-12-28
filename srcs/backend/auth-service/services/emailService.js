import nodemailer from 'nodemailer';

// Configure the email account to be used
// For testing, you can use Gmail, Outlook, or a test SMTP service
const transporter = nodemailer.createTransport({
  service: 'gmail', // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER, // email
    pass: process.env.EMAIL_PASS  // email app password
  }
});

/**
 * Send an email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - email body
 */
export async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    const error = new Error(`Failed to send email to ${to}`);
    error.statusCode = 500;
    error.code = 'EMAIL_SEND_FAILED';
    throw error;
  }
}

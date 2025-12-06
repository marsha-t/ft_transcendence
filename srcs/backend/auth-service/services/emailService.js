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
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

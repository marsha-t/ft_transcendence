import nodemailer from 'nodemailer';

// Configure the email account to be used for sending the OTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

// sendEmail Service
/*
 Service to send an email using a preconfigured SMTP transporter.
 - Accepts:
     - to: recipient email address
     - subject: email subject line
     - text: email body content
 - Uses the configured transporter to send the email via the Gmail service
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

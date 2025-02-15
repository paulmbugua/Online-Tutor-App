import nodemailer from 'nodemailer';

export const sendNotification = async ({ to, subject, body }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Gmail setup
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Elimika" <${process.env.EMAIL_USER}>`, // Your app's email
      to,
      subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw new Error('Failed to send email.');
  }
};

const nodemailer = require('nodemailer');

let transporter;
const simulatedEmails = [];

async function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log('Real SMTP Mail Transporter configured.');
  } else {
    try {
      // Fallback: Create ethereal account for testing
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Ethereal Email test account created: ${testAccount.user}`);
    } catch (err) {
      console.error('Failed to create Ethereal Email account. Falling back to log-only transport.', err);
      transporter = {
        sendMail: async (options) => {
          console.log('Log-only transport sendMail called.');
          return { messageId: 'log-only-' + Date.now() };
        }
      };
    }
  }
}

// Initialize transporter
initTransporter();

async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'no-reply@society-portal.com',
    to,
    subject,
    html,
  };

  const emailLog = {
    id: Math.random().toString(36).substring(2, 11),
    to,
    subject,
    html,
    timestamp: new Date(),
  };
  
  simulatedEmails.push(emailLog);
  if (simulatedEmails.length > 100) {
    simulatedEmails.shift();
  }

  console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);

  try {
    if (!transporter) {
      await initTransporter();
    }
    const info = await transporter.sendMail(mailOptions);
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`Ethereal Email preview URL: ${testUrl}`);
      emailLog.previewUrl = testUrl;
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    return null;
  }
}

function getSimulatedEmails() {
  return simulatedEmails;
}

module.exports = {
  sendEmail,
  getSimulatedEmails,
};
